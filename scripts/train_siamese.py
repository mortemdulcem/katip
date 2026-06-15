#!/usr/bin/env python3
"""
ChiroBench — Siamese CNN Egitim Scripti (v3.0 — Tam Donanim)
Adli Grafoloji Arastirmasi (Ankara Bilkent Sehir Hastanesi)
========================================================================
Mimari  : Siamese CNN (ResNet-50 / MobileNetV2 / EfficientNetB0)
Loss    : Contrastive Loss veya Triplet Loss (secimli)
Girdi   : 512x512 PNG goruntu (data/signatures_dataset/)
Cikti   : Egitilmis model (.h5) + performans raporlari + Grad-CAM

Dizin yapisi (beklenen):
  dataset_dir/
    katilimci_01_veriler/   (veya P001/ — isim farketmez)
      imza/        <-- gercek imzalar (genuine)
        001.png
        002.png
      taklit/      <-- baskasinin taklidi (skilled forgery)
        001.png
      paraf/       <-- gercek paraflar
        001.png
      W/  S/  I/  O/  alfa/
    katilimci_02_veriler/
      imza/
      taklit/
      ...

Ozellikler (v3.0):
  1.  Writer-independent split (data leakage onlendi)
  2.  Skilled forgery destegi (taklit klasoru)
  3.  EER (Equal Error Rate) hesaplama
  4.  FAR / FRR metrikleri
  5.  Kalibrasyon (reliability diagram + Temperature Scaling)
  6.  Grad-CAM gorselestirme
  7.  LOOCV (Leave-One-Out Cross Validation)
  8.  Optimal threshold otomatik belirleme
  9.  Data Augmentation (rotasyon, flip, gurultu, parlaklik, elastic)
  10. Preprocessing pipeline (Otsu binarizasyon, bounding-box crop)
  11. Triplet Loss alternatifi (--loss triplet)
  12. Adversarial test (FGSM saldirisi)
  13. Cross-dataset test destegi (CEDAR, GPDS, BHSig260 formati)
  14. Temperature Scaling kalibrasyonu
  15. Embedding t-SNE gorselestirme
  16. Per-shape (imza/paraf/W/...) ayri metrik raporu
  17. Cohen's Kappa istatistigi

Google Colab'da kullanim:
  !pip install tensorflow scikit-learn matplotlib seaborn
  !python scripts/train_siamese.py --dataset /content/signatures_dataset --all

Gereksinimler:
  tensorflow >= 2.12
  scikit-learn >= 1.2
  matplotlib >= 3.7
  seaborn >= 0.12
  numpy >= 1.24
  Pillow >= 9.5

Yazar: Dr. Ahmet GUNEY — SBU Ankara Bilkent Sehir Hastanesi
Tarih: 2025
"""

import os
import sys
import json
import argparse
import random
import itertools
import numpy as np
from pathlib import Path
from collections import defaultdict


def parse_args():
    p = argparse.ArgumentParser(description='ChiroBench Siamese CNN Egitim (v3)')
    p.add_argument('--dataset',  default='data/signatures_dataset', help='Veri seti dizini')
    p.add_argument('--output',   default='models/siamese_chirograph.h5', help='Model cikti yolu')
    p.add_argument('--epochs',   type=int, default=50, help='Egitim epoch sayisi')
    p.add_argument('--batch',    type=int, default=32, help='Batch boyutu')
    p.add_argument('--lr',       type=float, default=1e-4, help='Ogrenme hizi')
    p.add_argument('--backbone', choices=['mobilenet','resnet50','efficientnet'], default='resnet50')
    p.add_argument('--img-size', type=int, default=224, help='Giris goruntu boyutu')
    p.add_argument('--margin',   type=float, default=1.0, help='Contrastive/Triplet loss margin')
    p.add_argument('--seed',     type=int, default=42, help='Rastgelelik tohumu')
    p.add_argument('--report',   default='reports/siamese_report.json', help='Rapor cikti yolu')
    p.add_argument('--loocv',    action='store_true', help='Leave-One-Out Cross Validation modu')
    p.add_argument('--split-ratio', default='0.70,0.15,0.15', help='Train/Val/Test orani (kisi bazli)')
    p.add_argument('--max-pairs', type=int, default=500, help='Sinif basina maks cift sayisi')
    p.add_argument('--loss',     choices=['contrastive','triplet'], default='contrastive', help='Loss fonksiyonu')
    p.add_argument('--augment',  action='store_true', help='Data augmentation uygula')
    p.add_argument('--preprocess', action='store_true', help='Preprocessing pipeline (binarizasyon + crop)')
    p.add_argument('--gradcam',  action='store_true', help='Grad-CAM gorselestirme uret')
    p.add_argument('--adversarial', action='store_true', help='Adversarial test (FGSM)')
    p.add_argument('--tsne',     action='store_true', help='t-SNE embedding gorselestirme')
    p.add_argument('--cross-dataset', default=None, help='Cross-dataset test dizini (CEDAR/GPDS formati)')
    p.add_argument('--temp-scaling', action='store_true', help='Temperature Scaling kalibrasyonu')
    p.add_argument('--all',      action='store_true', help='Tum ozellikleri ac (augment+preprocess+gradcam+adversarial+tsne+temp-scaling)')
    return p.parse_args()


FORGERY_FOLDER = 'taklit'
GENUINE_SHAPES = ['imza', 'paraf', 'W', 'S', 'I', 'O', 'alfa']


def preprocess_image(img_array, apply_preprocessing=False):
    """
    Preprocessing pipeline:
    1. Gri tonlama donusumu
    2. Otsu Thresholding (binarizasyon)
    3. Median filter (gurultu temizleme)
    4. Bounding-box crop (bos alanlari kes)
    5. Aspect ratio koruyarak resize
    6. Tekrar RGB'ye cevir
    """
    if not apply_preprocessing:
        return img_array

    from PIL import Image as PILImage, ImageFilter

    img_uint8 = (img_array * 255).astype(np.uint8)
    pil_img = PILImage.fromarray(img_uint8)

    gray = pil_img.convert('L')
    gray_arr = np.array(gray)

    threshold = np.mean(gray_arr)
    try:
        hist, _ = np.histogram(gray_arr.flatten(), bins=256, range=(0, 256))
        total = gray_arr.size
        sum_total = np.sum(np.arange(256) * hist)
        sum_bg = 0
        w_bg = 0
        max_var = 0
        best_thresh = threshold
        for t in range(256):
            w_bg += hist[t]
            if w_bg == 0:
                continue
            w_fg = total - w_bg
            if w_fg == 0:
                break
            sum_bg += t * hist[t]
            mean_bg = sum_bg / w_bg
            mean_fg = (sum_total - sum_bg) / w_fg
            var = w_bg * w_fg * (mean_bg - mean_fg) ** 2
            if var > max_var:
                max_var = var
                best_thresh = t
        threshold = best_thresh
    except Exception:
        pass

    binary = (gray_arr > threshold).astype(np.uint8) * 255
    binary_img = PILImage.fromarray(binary)
    binary_img = binary_img.filter(ImageFilter.MedianFilter(3))

    binary_arr = np.array(binary_img)
    ink_pixels = np.where(binary_arr < 128)
    if len(ink_pixels[0]) > 10:
        y_min, y_max = ink_pixels[0].min(), ink_pixels[0].max()
        x_min, x_max = ink_pixels[1].min(), ink_pixels[1].max()
        pad = 10
        y_min = max(0, y_min - pad)
        y_max = min(binary_arr.shape[0], y_max + pad)
        x_min = max(0, x_min - pad)
        x_max = min(binary_arr.shape[1], x_max + pad)
        cropped = img_uint8[y_min:y_max, x_min:x_max]
    else:
        cropped = img_uint8

    pil_cropped = PILImage.fromarray(cropped)
    w, h = pil_cropped.size
    target_size = max(w, h)
    canvas = PILImage.new('RGB', (target_size, target_size), (255, 255, 255))
    paste_x = (target_size - w) // 2
    paste_y = (target_size - h) // 2
    canvas.paste(pil_cropped, (paste_x, paste_y))
    canvas = canvas.resize((img_array.shape[1], img_array.shape[0]), PILImage.LANCZOS)

    return np.array(canvas, dtype=np.float32) / 255.0


def augment_image(img_array):
    """
    Data Augmentation:
    1. Hafif rotasyon (+-5 derece)
    2. Yatay flip (%20 olasilik)
    3. Gaussian gurultu
    4. Parlaklik degisimi
    5. Elastic distortion (basit)
    """
    from PIL import Image as PILImage

    img = img_array.copy()

    angle = random.uniform(-5, 5)
    h, w = img.shape[:2]
    cx, cy = w / 2, h / 2
    cos_a = np.cos(np.radians(angle))
    sin_a = np.sin(np.radians(angle))
    pil_img = PILImage.fromarray((img * 255).astype(np.uint8))
    pil_img = pil_img.rotate(angle, fillcolor=(255, 255, 255), resample=PILImage.BILINEAR)
    img = np.array(pil_img, dtype=np.float32) / 255.0

    if random.random() < 0.2:
        img = img[:, ::-1, :].copy()

    noise_level = random.uniform(0, 0.02)
    noise = np.random.randn(*img.shape).astype(np.float32) * noise_level
    img = np.clip(img + noise, 0, 1)

    brightness = random.uniform(0.85, 1.15)
    img = np.clip(img * brightness, 0, 1)

    if random.random() < 0.3:
        dx = np.random.randn(h, w).astype(np.float32) * 2
        dy = np.random.randn(h, w).astype(np.float32) * 2
        x, y = np.meshgrid(np.arange(w), np.arange(h))
        x_new = np.clip((x + dx).astype(int), 0, w - 1)
        y_new = np.clip((y + dy).astype(int), 0, h - 1)
        img = img[y_new, x_new]

    return img


def load_dataset(dataset_dir: str, img_size: int, apply_preprocessing=False, apply_augment=False):
    """
    Veri setini yukler. Katilimci ismi ne olursa olsun calisir
    (P001, katilimci_01_veriler, vs.)
    """
    from PIL import Image as PILImage

    print('\n' + '='*60)
    print('VERI SETI YUKLENIYOR')
    print('='*60)
    print(f'  Dizin          : {dataset_dir}')
    print(f'  Boyut          : {img_size}x{img_size}')
    print(f'  Preprocessing  : {"EVET" if apply_preprocessing else "HAYIR"}')
    print(f'  Augmentation   : {"EVET" if apply_augment else "HAYIR"}')

    images = []
    labels = []
    dataset_path = Path(dataset_dir)

    if not dataset_path.exists():
        print(f'HATA: Dizin bulunamadi: {dataset_dir}')
        sys.exit(1)

    participants = sorted([d for d in dataset_path.iterdir() if d.is_dir()])
    stats = {'genuine': 0, 'forgery': 0, 'per_participant': {}, 'per_shape': defaultdict(int)}

    for participant_dir in participants:
        code = participant_dir.name
        stats['per_participant'][code] = {'genuine': 0, 'forgery': 0, 'shapes': defaultdict(int)}
        shapes = sorted([d for d in participant_dir.iterdir() if d.is_dir()])

        for shape_dir in shapes:
            shape = shape_dir.name
            is_forgery = (shape.lower() == FORGERY_FOLDER)
            pngs = sorted(list(shape_dir.glob('*.png')) + list(shape_dir.glob('*.jpg')) + list(shape_dir.glob('*.jpeg')))

            for png in pngs:
                try:
                    img = PILImage.open(png).convert('RGB')
                    img = img.resize((img_size, img_size), PILImage.LANCZOS)
                    arr = np.array(img, dtype=np.float32) / 255.0

                    arr = preprocess_image(arr, apply_preprocessing)

                    images.append(arr)
                    labels.append({
                        'participant': code,
                        'shape': shape,
                        'is_forgery': is_forgery,
                        'idx': len(images) - 1,
                        'file': str(png),
                    })
                    if is_forgery:
                        stats['forgery'] += 1
                        stats['per_participant'][code]['forgery'] += 1
                    else:
                        stats['genuine'] += 1
                        stats['per_participant'][code]['genuine'] += 1
                    stats['per_shape'][shape] += 1
                    stats['per_participant'][code]['shapes'][shape] += 1

                    if apply_augment and not is_forgery:
                        aug_img = augment_image(arr)
                        images.append(aug_img)
                        labels.append({
                            'participant': code,
                            'shape': shape,
                            'is_forgery': False,
                            'idx': len(images) - 1,
                            'file': str(png) + '_aug',
                        })
                        stats['genuine'] += 1
                        stats['per_participant'][code]['genuine'] += 1
                        stats['per_shape'][shape] += 1

                except Exception as e:
                    print(f'  UYARI: {png} yuklenemedi: {e}')

    participant_codes = sorted(set(l['participant'] for l in labels))
    print(f'\n  Katilimci sayisi : {len(participant_codes)}')
    print(f'  Toplam goruntu   : {len(images)}')
    print(f'  Genuine          : {stats["genuine"]}')
    print(f'  Forgery (taklit) : {stats["forgery"]}')
    print(f'\n  Sekil bazli dagilim:')
    for shape, count in sorted(stats['per_shape'].items()):
        marker = ' [FORGERY]' if shape.lower() == FORGERY_FOLDER else ''
        print(f'    {shape}: {count}{marker}')
    print(f'\n  Katilimci detay:')
    for code in participant_codes:
        s = stats['per_participant'][code]
        shapes_str = ', '.join(f'{k}:{v}' for k, v in sorted(s['shapes'].items()))
        print(f'    {code}: {s["genuine"]}g + {s["forgery"]}f | {shapes_str}')

    return np.array(images), labels, participant_codes, stats


def create_pairs_for_participants(images, labels, participant_set, max_pairs_per_class=500, seed=42):
    """
    Belirli katilimci kumesi icin cift olusturur.
    Genuine: ayni kisi + ayni sekil + gercek
    Forged:  (a) skilled forgery, (b) random forgery, (c) cross-forgery
    """
    rng = random.Random(seed)
    filtered = [l for l in labels if l['participant'] in participant_set]

    genuine_group = defaultdict(list)
    forgery_group = defaultdict(list)
    shape_group = defaultdict(lambda: defaultdict(list))

    for l in filtered:
        idx = l['idx']
        code = l['participant']
        shape = l['shape']

        if l['is_forgery']:
            forgery_group[code].append(idx)
        else:
            genuine_group[(code, shape)].append(idx)
            shape_group[shape][code].append(idx)

    pairs_img1, pairs_img2, pair_labels, pair_types = [], [], [], []

    for (code, shape), idxs in genuine_group.items():
        if len(idxs) < 2:
            continue
        combos = list(itertools.combinations(idxs, 2))
        rng.shuffle(combos)
        for i1, i2 in combos[:max_pairs_per_class]:
            pairs_img1.append(images[i1])
            pairs_img2.append(images[i2])
            pair_labels.append(0)
            pair_types.append('genuine')

    for code, forgery_idxs in forgery_group.items():
        genuine_imza = genuine_group.get((code, 'imza'), [])
        if genuine_imza and forgery_idxs:
            skilled_pairs = []
            for gi in genuine_imza:
                for fi in forgery_idxs:
                    skilled_pairs.append((gi, fi))
            rng.shuffle(skilled_pairs)
            for i1, i2 in skilled_pairs[:max_pairs_per_class]:
                pairs_img1.append(images[i1])
                pairs_img2.append(images[i2])
                pair_labels.append(1)
                pair_types.append('skilled_forgery')

    for shape, code_dict in shape_group.items():
        codes = list(code_dict.keys())
        if len(codes) < 2:
            continue
        random_pairs = []
        for c1, c2 in itertools.combinations(codes, 2):
            for i1 in code_dict[c1][:8]:
                for i2 in code_dict[c2][:8]:
                    random_pairs.append((i1, i2))
        rng.shuffle(random_pairs)
        for i1, i2 in random_pairs[:max_pairs_per_class]:
            pairs_img1.append(images[i1])
            pairs_img2.append(images[i2])
            pair_labels.append(1)
            pair_types.append('random_forgery')

    n_genuine = pair_labels.count(0)
    n_forged = pair_labels.count(1)

    if n_genuine > 0 and n_forged > 0:
        min_count = min(n_genuine, n_forged)
        genuine_idx = [i for i, l in enumerate(pair_labels) if l == 0]
        forged_idx = [i for i, l in enumerate(pair_labels) if l == 1]
        rng.shuffle(genuine_idx)
        rng.shuffle(forged_idx)
        keep = sorted(genuine_idx[:min_count] + forged_idx[:min_count])
        pairs_img1 = [pairs_img1[i] for i in keep]
        pairs_img2 = [pairs_img2[i] for i in keep]
        pair_labels = [pair_labels[i] for i in keep]
        pair_types = [pair_types[i] for i in keep]

    total = len(pair_labels)
    n_genuine = pair_labels.count(0)
    n_forged = pair_labels.count(1)
    n_skilled = pair_types.count('skilled_forgery')
    n_random = pair_types.count('random_forgery')
    print(f'    Ciftler: {total} toplam | {n_genuine} genuine | {n_forged} forged (skilled:{n_skilled}, random:{n_random})')

    if total == 0:
        return (np.array([]), np.array([])), np.array([]), pair_types

    return (np.array(pairs_img1), np.array(pairs_img2)), np.array(pair_labels, dtype=np.float32), pair_types


def create_triplets_for_participants(images, labels, participant_set, max_triplets=2000, seed=42):
    """
    Triplet Loss icin (anchor, positive, negative) ucluler olusturur.
    Anchor + Positive: ayni kisi, ayni sekil
    Negative: farkli kisi ayni sekil VEYA ayni kisinin taklidi
    """
    rng = random.Random(seed)
    filtered = [l for l in labels if l['participant'] in participant_set]

    genuine_group = defaultdict(list)
    forgery_group = defaultdict(list)
    shape_group = defaultdict(lambda: defaultdict(list))

    for l in filtered:
        if l['is_forgery']:
            forgery_group[l['participant']].append(l['idx'])
        else:
            genuine_group[(l['participant'], l['shape'])].append(l['idx'])
            shape_group[l['shape']][l['participant']].append(l['idx'])

    anchors, positives, negatives = [], [], []

    for (code, shape), idxs in genuine_group.items():
        if len(idxs) < 2:
            continue

        neg_candidates = []
        for other_code, other_idxs in shape_group[shape].items():
            if other_code != code:
                neg_candidates.extend(other_idxs)
        if code in forgery_group:
            neg_candidates.extend(forgery_group[code])

        if not neg_candidates:
            continue

        pairs = list(itertools.combinations(idxs, 2))
        rng.shuffle(pairs)
        for a, p in pairs[:max_triplets // len(genuine_group)]:
            n = rng.choice(neg_candidates)
            anchors.append(images[a])
            positives.append(images[p])
            negatives.append(images[n])

    total = len(anchors)
    if total > max_triplets:
        idx_keep = list(range(total))
        rng.shuffle(idx_keep)
        idx_keep = idx_keep[:max_triplets]
        anchors = [anchors[i] for i in idx_keep]
        positives = [positives[i] for i in idx_keep]
        negatives = [negatives[i] for i in idx_keep]

    print(f'    Triplet sayisi: {len(anchors)}')
    if len(anchors) == 0:
        return (np.array([]), np.array([]), np.array([]))
    return (np.array(anchors), np.array(positives), np.array(negatives))


def writer_independent_split(participant_codes, split_ratio_str, seed=42):
    """
    Katilimcilari writer-independent olarak train/val/test'e ayirir.
    KRITIK: Ayni kisinin imzalari ASLA birden fazla sette bulunmaz.
    """
    rng = random.Random(seed)
    ratios = [float(x) for x in split_ratio_str.split(',')]
    assert len(ratios) == 3 and abs(sum(ratios) - 1.0) < 0.01, \
        f'Split oranlari toplamda 1.0 olmali, su an: {ratios}'

    codes = list(participant_codes)
    rng.shuffle(codes)
    n = len(codes)
    t1 = max(1, int(n * ratios[0]))
    t2 = max(t1 + 1, int(n * (ratios[0] + ratios[1])))

    train_codes = set(codes[:t1])
    val_codes = set(codes[t1:t2])
    test_codes = set(codes[t2:])

    if not test_codes:
        test_codes = {codes[-1]}
        val_codes.discard(codes[-1])
    if not val_codes:
        val_codes = {codes[t1 - 1]} if t1 > 1 else {codes[0]}
        train_codes.discard(codes[t1 - 1] if t1 > 1 else codes[0])

    print(f'\n  WRITER-INDEPENDENT SPLIT:')
    print(f'    Train kisiler ({len(train_codes)}): {sorted(train_codes)}')
    print(f'    Val   kisiler ({len(val_codes)}):   {sorted(val_codes)}')
    print(f'    Test  kisiler ({len(test_codes)}):  {sorted(test_codes)}')
    overlap_tv = train_codes & val_codes
    overlap_tt = train_codes & test_codes
    overlap_vt = val_codes & test_codes
    print(f'    Cakisma: train&val={overlap_tv}, train&test={overlap_tt}, val&test={overlap_vt}')
    if overlap_tv or overlap_tt or overlap_vt:
        print('    !!! UYARI: CAKISMA VAR — DATA LEAKAGE RISKI !!!')

    return train_codes, val_codes, test_codes


def build_embedding_network(img_size, backbone_name):
    import tensorflow as tf
    from tensorflow.keras import layers, Model, Input

    inp_shape = (img_size, img_size, 3)

    if backbone_name == 'resnet50':
        from tensorflow.keras.applications import ResNet50
        base = ResNet50(weights='imagenet', include_top=False, input_shape=inp_shape, pooling='avg')
    elif backbone_name == 'mobilenet':
        from tensorflow.keras.applications import MobileNetV2
        base = MobileNetV2(weights='imagenet', include_top=False, input_shape=inp_shape, pooling='avg')
    elif backbone_name == 'efficientnet':
        from tensorflow.keras.applications import EfficientNetB0
        base = EfficientNetB0(weights='imagenet', include_top=False, input_shape=inp_shape, pooling='avg')

    for layer in base.layers[:-20]:
        layer.trainable = False
    for layer in base.layers[-20:]:
        layer.trainable = True

    emb_inp = Input(inp_shape)
    x = base(emb_inp)
    x = layers.Dense(512, activation='relu', name='emb_dense_512')(x)
    x = layers.BatchNormalization(name='emb_bn')(x)
    x = layers.Dropout(0.4, name='emb_dropout')(x)
    x = layers.Dense(256, name='emb_dense_256')(x)
    x = layers.Lambda(lambda t: tf.math.l2_normalize(t, axis=1), name='l2_norm')(x)
    embedding_model = Model(emb_inp, x, name='embedding')

    trainable_count = sum(np.prod(v.shape) for v in embedding_model.trainable_variables)
    total_count = sum(np.prod(v.shape) for v in embedding_model.variables)
    print(f'\n  Omurga: {backbone_name}')
    print(f'  Trainable params : {trainable_count:,}')
    print(f'  Total params     : {total_count:,}')

    return embedding_model, inp_shape


def build_siamese_contrastive(embedding_model, inp_shape, lr, margin):
    import tensorflow as tf
    from tensorflow.keras import Model, Input
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras import layers

    inp1 = Input(inp_shape, name='input_1')
    inp2 = Input(inp_shape, name='input_2')
    emb1 = embedding_model(inp1)
    emb2 = embedding_model(inp2)

    distance = layers.Lambda(
        lambda t: tf.sqrt(tf.reduce_sum(tf.square(t[0] - t[1]), axis=1, keepdims=True) + 1e-8),
        name='l2_distance'
    )([emb1, emb2])

    siamese = Model([inp1, inp2], distance, name='siamese_contrastive')

    def contrastive_loss(y_true, y_pred):
        sq_pred = tf.square(y_pred)
        margin_sq = tf.square(tf.maximum(margin - y_pred, 0))
        return tf.reduce_mean((1 - y_true) * sq_pred + y_true * margin_sq)

    siamese.compile(optimizer=Adam(learning_rate=lr), loss=contrastive_loss)
    print(f'  Loss: Contrastive (margin={margin})')
    return siamese


def build_siamese_triplet(embedding_model, inp_shape, lr, margin):
    import tensorflow as tf
    from tensorflow.keras import Model, Input
    from tensorflow.keras.optimizers import Adam
    from tensorflow.keras import layers

    anchor_inp = Input(inp_shape, name='anchor')
    pos_inp = Input(inp_shape, name='positive')
    neg_inp = Input(inp_shape, name='negative')

    emb_a = embedding_model(anchor_inp)
    emb_p = embedding_model(pos_inp)
    emb_n = embedding_model(neg_inp)

    merged = layers.Concatenate(name='triplet_concat')([emb_a, emb_p, emb_n])
    triplet_model = Model([anchor_inp, pos_inp, neg_inp], merged, name='siamese_triplet')

    def triplet_loss(y_true, y_pred):
        emb_size = 256
        a = y_pred[:, :emb_size]
        p = y_pred[:, emb_size:2*emb_size]
        n = y_pred[:, 2*emb_size:]
        d_ap = tf.reduce_sum(tf.square(a - p), axis=1)
        d_an = tf.reduce_sum(tf.square(a - n), axis=1)
        return tf.reduce_mean(tf.maximum(d_ap - d_an + margin, 0.0))

    triplet_model.compile(optimizer=Adam(learning_rate=lr), loss=triplet_loss)
    print(f'  Loss: Triplet (margin={margin})')
    return triplet_model


def compute_eer(y_true, distances):
    from sklearn.metrics import roc_curve
    fpr, tpr, thresholds = roc_curve(y_true, distances)
    fnr = 1 - tpr
    eer_idx = np.nanargmin(np.abs(fnr - fpr))
    eer = float((fpr[eer_idx] + fnr[eer_idx]) / 2)
    eer_threshold = float(thresholds[eer_idx]) if eer_idx < len(thresholds) else 0.5
    return eer, eer_threshold, fpr, fnr, thresholds


def find_optimal_threshold(y_true, distances):
    from sklearn.metrics import f1_score
    best_f1 = 0
    best_thresh = 0.5
    for thresh in np.arange(0.05, 2.0, 0.01):
        preds = (distances > thresh).astype(int)
        f1 = f1_score(y_true, preds, average='binary', zero_division=0)
        if f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh
    return best_thresh, best_f1


def evaluate_model(model, pairs_test, labels_test, pair_types=None, loss_type='contrastive'):
    from sklearn.metrics import (accuracy_score, confusion_matrix,
                                  roc_auc_score, f1_score, cohen_kappa_score)

    print('\n' + '='*60)
    print('MODEL DEGERLENDIRME')
    print('='*60)

    if loss_type == 'contrastive':
        distances = model.predict(pairs_test, verbose=0).flatten()
    else:
        print('  Triplet modelde contrastive evaluation icin embedding kullaniliyor...')
        emb_model = model.get_layer('embedding')
        emb1 = emb_model.predict(pairs_test[0], verbose=0)
        emb2 = emb_model.predict(pairs_test[1], verbose=0)
        distances = np.sqrt(np.sum((emb1 - emb2)**2, axis=1) + 1e-8)

    y_true = labels_test.astype(int)

    eer, eer_threshold, far_arr, frr_arr, thresholds = compute_eer(y_true, distances)
    optimal_thresh, optimal_f1 = find_optimal_threshold(y_true, distances)

    print(f'\n  EER              : {eer*100:.2f}%')
    print(f'  EER Threshold    : {eer_threshold:.4f}')
    print(f'  Optimal Threshold: {optimal_thresh:.4f} (F1={optimal_f1:.4f})')

    use_threshold = eer_threshold
    y_pred = (distances > use_threshold).astype(int)

    acc = accuracy_score(y_true, y_pred)
    f1 = f1_score(y_true, y_pred, average='binary', zero_division=0)
    auc = roc_auc_score(y_true, distances) if len(set(y_true)) > 1 else 0.0
    kappa = cohen_kappa_score(y_true, y_pred)
    cm = confusion_matrix(y_true, y_pred)

    if cm.shape == (2, 2):
        tn, fp, fn, tp = cm.ravel()
    else:
        tn = fp = fn = tp = 0

    sens = tp / (tp + fn) if (tp + fn) > 0 else 0
    spec = tn / (tn + fp) if (tn + fp) > 0 else 0
    ppv = tp / (tp + fp) if (tp + fp) > 0 else 0
    npv = tn / (tn + fn) if (tn + fn) > 0 else 0
    far = fp / (fp + tn) if (fp + tn) > 0 else 0
    frr = fn / (fn + tp) if (fn + tp) > 0 else 0

    report = {
        'n_test': len(y_true),
        'n_genuine_pairs': int(np.sum(y_true == 0)),
        'n_forged_pairs': int(np.sum(y_true == 1)),
        'eer': round(float(eer), 4),
        'eer_threshold': round(float(eer_threshold), 4),
        'optimal_threshold': round(float(optimal_thresh), 4),
        'optimal_f1': round(float(optimal_f1), 4),
        'threshold_used': round(float(use_threshold), 4),
        'accuracy': round(float(acc), 4),
        'sensitivity': round(float(sens), 4),
        'specificity': round(float(spec), 4),
        'ppv': round(float(ppv), 4),
        'npv': round(float(npv), 4),
        'f1': round(float(f1), 4),
        'auc_roc': round(float(auc), 4),
        'far': round(float(far), 4),
        'frr': round(float(frr), 4),
        'cohens_kappa': round(float(kappa), 4),
        'confusion_matrix': {'TP': int(tp), 'FP': int(fp), 'TN': int(tn), 'FN': int(fn)},
    }

    if pair_types:
        type_results = {}
        for ptype in set(pair_types):
            idxs = [i for i, t in enumerate(pair_types) if t == ptype]
            if idxs:
                sub_dist = distances[idxs]
                sub_true = y_true[idxs]
                sub_pred = (sub_dist > use_threshold).astype(int)
                sub_acc = accuracy_score(sub_true, sub_pred)
                type_results[ptype] = {
                    'count': len(idxs),
                    'accuracy': round(float(sub_acc), 4),
                    'mean_distance': round(float(np.mean(sub_dist)), 4),
                    'std_distance': round(float(np.std(sub_dist)), 4),
                }
        report['per_type_results'] = type_results
        print(f'\n  Cift tipi bazli sonuclar:')
        for ptype, res in type_results.items():
            print(f'    {ptype:20s}: acc={res["accuracy"]*100:.1f}%, '
                  f'n={res["count"]}, dist={res["mean_distance"]:.3f}+-{res["std_distance"]:.3f}')

    print(f'\n  Threshold : {use_threshold:.4f}')
    print(f'  Accuracy  : {acc*100:.2f}%')
    print(f'  Sensitivity: {sens*100:.2f}%  |  Specificity: {spec*100:.2f}%')
    print(f'  PPV       : {ppv*100:.2f}%  |  NPV: {npv*100:.2f}%')
    print(f'  F1 Score  : {f1*100:.2f}%')
    print(f'  AUC-ROC   : {auc:.4f}')
    print(f'  FAR       : {far*100:.2f}%  |  FRR: {frr*100:.2f}%')
    print(f'  EER       : {eer*100:.2f}%')
    print(f'  Cohen Kappa: {kappa:.4f}')
    print(f'  CM: TP={tp}, FP={fp}, TN={tn}, FN={fn}')

    return report, distances


def plot_results(history, labels_test, distances, report, report_dir):
    import matplotlib.pyplot as plt
    import seaborn as sns
    from sklearn.metrics import roc_curve, confusion_matrix

    os.makedirs(report_dir, exist_ok=True)
    y_true = labels_test.astype(int)

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    axes[0].plot(history.history['loss'], label='Train Loss', color='#2563eb')
    if 'val_loss' in history.history:
        axes[0].plot(history.history['val_loss'], label='Val Loss', color='#dc2626')
    axes[0].set_title('Loss Egitim Egrisi')
    axes[0].legend()
    axes[0].set_xlabel('Epoch')
    axes[0].set_ylabel('Loss')
    axes[0].grid(True, alpha=0.3)

    metrics_names = ['1-EER', 'Acc', 'Sens', 'Spec', 'PPV', 'NPV', 'F1', 'AUC', 'Kappa']
    metrics_vals = [
        (1 - report['eer']) * 100,
        report['accuracy'] * 100,
        report['sensitivity'] * 100,
        report['specificity'] * 100,
        report['ppv'] * 100,
        report['npv'] * 100,
        report['f1'] * 100,
        report['auc_roc'] * 100,
        (report['cohens_kappa'] + 1) / 2 * 100,
    ]
    colors = ['#22c55e' if v >= 80 else '#f59e0b' if v >= 65 else '#ef4444' for v in metrics_vals]
    bars = axes[1].bar(metrics_names, metrics_vals, color=colors)
    axes[1].set_ylim(0, 100)
    axes[1].axhline(80, color='gray', linestyle='--', alpha=0.5)
    axes[1].set_ylabel('%')
    axes[1].set_title('Performans Metrikleri')
    for bar, val in zip(bars, metrics_vals):
        axes[1].text(bar.get_x() + bar.get_width()/2, bar.get_height() + 1,
                     f'{val:.1f}', ha='center', va='bottom', fontsize=7)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'training_curves.png'), dpi=150)
    plt.close()

    fpr, tpr, _ = roc_curve(y_true, distances)
    fig, ax = plt.subplots(figsize=(7, 7))
    ax.plot(fpr, tpr, color='#6366f1', lw=2, label=f"AUC = {report['auc_roc']:.4f}")
    ax.plot([0, 1], [0, 1], '--', color='gray')
    fnr = 1 - tpr
    eer_idx = np.nanargmin(np.abs(fnr - fpr))
    ax.plot(fpr[eer_idx], tpr[eer_idx], 'ro', markersize=10, label=f"EER = {report['eer']*100:.2f}%")
    ax.set_xlabel('FPR')
    ax.set_ylabel('TPR')
    ax.set_title('ROC Egrisi')
    ax.legend(loc='lower right')
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'roc_curve.png'), dpi=150)
    plt.close()

    threshold = report['threshold_used']
    y_pred = (distances > threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    fig, ax = plt.subplots(figsize=(6, 5))
    sns.heatmap(cm, annot=True, fmt='d', cmap='Blues',
                xticklabels=['Genuine', 'Forged'],
                yticklabels=['Genuine', 'Forged'], ax=ax)
    ax.set_title(f'Confusion Matrix (T={threshold:.3f})')
    ax.set_xlabel('Tahmin')
    ax.set_ylabel('Gercek')
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'confusion_matrix.png'), dpi=150)
    plt.close()

    genuine_d = distances[y_true == 0]
    forged_d = distances[y_true == 1]
    fig, ax = plt.subplots(figsize=(10, 5))
    ax.hist(genuine_d, bins=50, alpha=0.7, color='#22c55e', label=f'Genuine (n={len(genuine_d)})', density=True)
    ax.hist(forged_d, bins=50, alpha=0.7, color='#ef4444', label=f'Forged (n={len(forged_d)})', density=True)
    ax.axvline(threshold, color='black', linestyle='--', lw=2, label=f"EER T={threshold:.3f}")
    ax.axvline(report['optimal_threshold'], color='#6366f1', linestyle=':', lw=2, label=f"Opt T={report['optimal_threshold']:.3f}")
    ax.set_xlabel('L2 Mesafesi')
    ax.set_ylabel('Yogunluk')
    ax.set_title('Mesafe Dagilimi')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'distance_distribution.png'), dpi=150)
    plt.close()

    fig, axes = plt.subplots(1, 2, figsize=(14, 5))
    thresholds_range = np.linspace(min(distances), max(distances), 200)
    fars, frrs, f1s_arr = [], [], []
    for t in thresholds_range:
        preds = (distances > t).astype(int)
        fp_c = np.sum((preds == 1) & (y_true == 0))
        tn_c = np.sum((preds == 0) & (y_true == 0))
        fn_c = np.sum((preds == 0) & (y_true == 1))
        tp_c = np.sum((preds == 1) & (y_true == 1))
        fars.append(fp_c / (fp_c + tn_c) if (fp_c + tn_c) > 0 else 0)
        frrs.append(fn_c / (fn_c + tp_c) if (fn_c + tp_c) > 0 else 0)
        from sklearn.metrics import f1_score as f1s
        f1s_arr.append(f1s(y_true, preds, zero_division=0))

    axes[0].plot(thresholds_range, fars, color='#ef4444', lw=2, label='FAR')
    axes[0].plot(thresholds_range, frrs, color='#2563eb', lw=2, label='FRR')
    cross_idx = np.nanargmin(np.abs(np.array(fars) - np.array(frrs)))
    axes[0].plot(thresholds_range[cross_idx], fars[cross_idx], 'ko', markersize=10,
                 label=f'EER={fars[cross_idx]*100:.2f}%')
    axes[0].set_xlabel('Threshold')
    axes[0].set_ylabel('Hata Orani')
    axes[0].set_title('FAR vs FRR')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    axes[1].plot(thresholds_range, f1s_arr, color='#22c55e', lw=2)
    best_idx = np.argmax(f1s_arr)
    axes[1].axvline(thresholds_range[best_idx], color='black', linestyle='--',
                    label=f'Best T={thresholds_range[best_idx]:.3f} (F1={f1s_arr[best_idx]:.3f})')
    axes[1].set_xlabel('Threshold')
    axes[1].set_ylabel('F1')
    axes[1].set_title('F1 vs Threshold')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'far_frr_f1.png'), dpi=150)
    plt.close()

    print(f'  Grafikler kaydedildi: {report_dir}/')


def plot_calibration(y_true, distances, report_dir):
    import matplotlib.pyplot as plt
    os.makedirs(report_dir, exist_ok=True)

    d_min, d_max = distances.min(), distances.max()
    if d_max - d_min < 1e-6:
        print('  UYARI: Mesafe dagilimi cok dar, kalibrasyon atlandi.')
        return None

    probs = 1 - (distances - d_min) / (d_max - d_min + 1e-8)
    probs = np.clip(probs, 0, 1)
    genuine_mask = (y_true == 0)

    n_bins = 10
    bin_edges = np.linspace(0, 1, n_bins + 1)
    bin_acc, bin_conf, bin_count = [], [], []

    for i in range(n_bins):
        mask = (probs >= bin_edges[i]) & (probs < bin_edges[i + 1])
        if np.sum(mask) > 0:
            bin_acc.append(np.mean(genuine_mask[mask]))
            bin_conf.append(np.mean(probs[mask]))
            bin_count.append(int(np.sum(mask)))
        else:
            bin_acc.append(0)
            bin_conf.append((bin_edges[i] + bin_edges[i + 1]) / 2)
            bin_count.append(0)

    ece = sum(
        (c / len(probs)) * abs(a - co) for a, co, c in zip(bin_acc, bin_conf, bin_count) if c > 0
    )

    fig, axes = plt.subplots(1, 2, figsize=(14, 6))
    axes[0].bar(bin_conf, bin_acc, width=0.08, alpha=0.7, color='#2563eb', label='Model')
    axes[0].plot([0, 1], [0, 1], 'k--', label='Ideal')
    axes[0].set_xlabel('Tahmin')
    axes[0].set_ylabel('Gercek')
    axes[0].set_title(f'Kalibrasyon (ECE={ece:.4f})')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    axes[1].bar(bin_conf, bin_count, width=0.08, alpha=0.7, color='#f59e0b')
    axes[1].set_xlabel('Guven')
    axes[1].set_ylabel('Sayi')
    axes[1].set_title('Guven Dagilimi')
    axes[1].grid(True, alpha=0.3)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'calibration_diagram.png'), dpi=150)
    plt.close()

    print(f'  ECE: {ece:.4f}')
    return ece


def temperature_scaling(y_true, distances, report_dir):
    """
    Temperature Scaling: Modelin ciktilarini kalibre eder.
    Tek bir T parametresi ogrenilir, NLL minimize edilir.
    """
    print('\n  Temperature Scaling...')
    d_min, d_max = distances.min(), distances.max()
    if d_max - d_min < 1e-6:
        print('  UYARI: Mesafe dagilimi cok dar, T-scaling atlandi.')
        return 1.0

    logits = -(distances - d_min) / (d_max - d_min + 1e-8)

    best_t = 1.0
    best_nll = float('inf')
    for t in np.arange(0.1, 5.0, 0.05):
        scaled = logits / t
        probs = 1 / (1 + np.exp(-scaled))
        probs = np.clip(probs, 1e-7, 1 - 1e-7)
        genuine_mask = (y_true == 0).astype(float)
        nll = -np.mean(genuine_mask * np.log(probs) + (1 - genuine_mask) * np.log(1 - probs))
        if nll < best_nll:
            best_nll = nll
            best_t = t

    print(f'  Optimal Temperature: {best_t:.2f} (NLL={best_nll:.4f})')

    import matplotlib.pyplot as plt
    temps = np.arange(0.1, 5.0, 0.05)
    nlls = []
    for t in temps:
        scaled = logits / t
        probs = 1 / (1 + np.exp(-scaled))
        probs = np.clip(probs, 1e-7, 1 - 1e-7)
        genuine_mask = (y_true == 0).astype(float)
        nll = -np.mean(genuine_mask * np.log(probs) + (1 - genuine_mask) * np.log(1 - probs))
        nlls.append(nll)

    fig, ax = plt.subplots(figsize=(8, 5))
    ax.plot(temps, nlls, color='#6366f1', lw=2)
    ax.axvline(best_t, color='red', linestyle='--', label=f'T*={best_t:.2f}')
    ax.set_xlabel('Temperature')
    ax.set_ylabel('NLL')
    ax.set_title('Temperature Scaling Optimizasyonu')
    ax.legend()
    ax.grid(True, alpha=0.3)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'temperature_scaling.png'), dpi=150)
    plt.close()

    return best_t


def generate_gradcam(embedding_model, test_images, report_dir, n_samples=8):
    import tensorflow as tf
    import matplotlib.pyplot as plt
    os.makedirs(report_dir, exist_ok=True)

    last_conv_layer = None
    backbone = None
    for layer in embedding_model.layers:
        if hasattr(layer, 'layers') and len(layer.layers) > 10:
            backbone = layer
            break

    if backbone is None:
        print('  UYARI: Backbone bulunamadi, Grad-CAM atlandi.')
        return

    for sublayer in reversed(backbone.layers):
        if len(getattr(sublayer, 'output_shape', ())) == 4:
            last_conv_layer = sublayer
            break

    if last_conv_layer is None:
        print('  UYARI: Conv katmani bulunamadi, Grad-CAM atlandi.')
        return

    print(f'  Grad-CAM katmani: {last_conv_layer.name}')

    try:
        grad_model = tf.keras.Model(
            inputs=backbone.input,
            outputs=[backbone.get_layer(last_conv_layer.name).output, backbone.output]
        )
    except Exception as e:
        print(f'  UYARI: Grad-CAM model olusturulamadi: {e}')
        return

    n_samples = min(n_samples, len(test_images))
    cols = min(4, n_samples)
    rows = 2
    fig, axes = plt.subplots(rows, cols, figsize=(4 * cols, 8))

    for i in range(min(cols, n_samples)):
        img = test_images[i:i+1]
        with tf.GradientTape() as tape:
            conv_out, pred = grad_model(img)
            loss = tf.reduce_mean(pred)
        grads = tape.gradient(loss, conv_out)
        if grads is None:
            continue
        weights = tf.reduce_mean(grads, axis=(1, 2))
        cam = tf.reduce_sum(conv_out * weights[:, tf.newaxis, tf.newaxis, :], axis=-1)
        cam = tf.nn.relu(cam)[0].numpy()
        if cam.max() > 0:
            cam = cam / cam.max()

        from PIL import Image as PILImage
        cam_resized = np.array(
            PILImage.fromarray((cam * 255).astype(np.uint8)).resize(
                (img.shape[2], img.shape[1]), PILImage.BILINEAR
            )
        ) / 255.0

        ax_top = axes[0][i] if cols > 1 else axes[0]
        ax_bot = axes[1][i] if cols > 1 else axes[1]

        ax_top.imshow(img[0])
        ax_top.set_title(f'#{i+1}')
        ax_top.axis('off')
        ax_bot.imshow(img[0])
        ax_bot.imshow(cam_resized, cmap='jet', alpha=0.5)
        ax_bot.set_title('Grad-CAM')
        ax_bot.axis('off')

    plt.suptitle('Grad-CAM — Model Nereye Bakiyor?', fontsize=14)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'gradcam_heatmaps.png'), dpi=150)
    plt.close()
    print(f'  Grad-CAM kaydedildi.')


def adversarial_test(model, embedding_model, pairs_test, labels_test, report_dir, epsilon=0.01):
    """
    FGSM (Fast Gradient Sign Method) adversarial saldiri testi.
    Modelin kucuk piksel degisikliklerine karsi ne kadar dayanikli oldugunu olcer.
    """
    import tensorflow as tf
    import matplotlib.pyplot as plt

    print('\n' + '='*60)
    print('ADVERSARIAL TEST (FGSM)')
    print(f'  Epsilon: {epsilon}')
    print('='*60)

    inp1_tensor = tf.convert_to_tensor(pairs_test[0], dtype=tf.float32)
    inp2_tensor = tf.convert_to_tensor(pairs_test[1], dtype=tf.float32)

    with tf.GradientTape() as tape:
        tape.watch(inp1_tensor)
        distances = model([inp1_tensor, inp2_tensor])
        loss = tf.reduce_mean(distances)

    grads = tape.gradient(loss, inp1_tensor)
    if grads is None:
        print('  UYARI: Gradient alinamadi, adversarial test atlandi.')
        return None

    perturbation = epsilon * tf.sign(grads)
    adv_images = tf.clip_by_value(inp1_tensor + perturbation, 0, 1)

    clean_dist = model.predict([pairs_test[0], pairs_test[1]], verbose=0).flatten()
    adv_dist = model.predict([adv_images.numpy(), pairs_test[1]], verbose=0).flatten()

    y_true = labels_test.astype(int)
    threshold = float(np.median(clean_dist))

    clean_pred = (clean_dist > threshold).astype(int)
    adv_pred = (adv_dist > threshold).astype(int)

    from sklearn.metrics import accuracy_score
    clean_acc = accuracy_score(y_true, clean_pred)
    adv_acc = accuracy_score(y_true, adv_pred)
    flip_rate = np.mean(clean_pred != adv_pred)

    print(f'  Clean Accuracy    : {clean_acc*100:.2f}%')
    print(f'  Adversarial Acc   : {adv_acc*100:.2f}%')
    print(f'  Accuracy Dusus    : {(clean_acc - adv_acc)*100:.2f}%')
    print(f'  Karar Degisme Orani: {flip_rate*100:.2f}%')

    fig, axes = plt.subplots(1, 3, figsize=(15, 5))

    axes[0].hist(clean_dist, bins=40, alpha=0.7, color='#22c55e', label='Clean', density=True)
    axes[0].hist(adv_dist, bins=40, alpha=0.7, color='#ef4444', label='Adversarial', density=True)
    axes[0].set_title('Mesafe Dagilimi: Clean vs Adversarial')
    axes[0].legend()
    axes[0].grid(True, alpha=0.3)

    epsilons = [0.001, 0.005, 0.01, 0.02, 0.05, 0.1]
    accs = []
    for eps in epsilons:
        pert = eps * tf.sign(grads)
        adv = tf.clip_by_value(inp1_tensor + pert, 0, 1)
        d = model.predict([adv.numpy(), pairs_test[1]], verbose=0).flatten()
        p = (d > threshold).astype(int)
        accs.append(accuracy_score(y_true, p))

    axes[1].plot(epsilons, [a * 100 for a in accs], 'bo-', lw=2)
    axes[1].axhline(clean_acc * 100, color='gray', linestyle='--', label=f'Clean: {clean_acc*100:.1f}%')
    axes[1].set_xlabel('Epsilon')
    axes[1].set_ylabel('Accuracy %')
    axes[1].set_title('Epsilon vs Accuracy')
    axes[1].legend()
    axes[1].grid(True, alpha=0.3)

    if len(pairs_test[0]) > 0:
        idx = 0
        orig = pairs_test[0][idx]
        adv_img = adv_images[idx].numpy()
        diff = np.abs(orig - adv_img)
        axes[2].imshow(diff * 10)
        axes[2].set_title(f'Perturbation (10x, eps={epsilon})')
        axes[2].axis('off')

    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'adversarial_test.png'), dpi=150)
    plt.close()

    return {
        'epsilon': epsilon,
        'clean_accuracy': round(float(clean_acc), 4),
        'adversarial_accuracy': round(float(adv_acc), 4),
        'accuracy_drop': round(float(clean_acc - adv_acc), 4),
        'flip_rate': round(float(flip_rate), 4),
    }


def plot_tsne(embedding_model, images, labels, report_dir, n_max=500):
    """
    t-SNE gorselestirme: Embeddinglerin 2D dagilimini gosterir.
    Ayni kisinin imzalari kumeleniyor mu? Farkli kisiler ayrilabiliyor mu?
    """
    import matplotlib.pyplot as plt

    print('\n  t-SNE embedding gorselestirme...')

    idx_sample = list(range(len(images)))
    if len(idx_sample) > n_max:
        random.shuffle(idx_sample)
        idx_sample = idx_sample[:n_max]

    sample_imgs = images[idx_sample]
    sample_labels = [labels[i] for i in idx_sample]

    embeddings = embedding_model.predict(sample_imgs, verbose=0)

    try:
        from sklearn.manifold import TSNE
        tsne = TSNE(n_components=2, random_state=42, perplexity=min(30, len(embeddings) - 1))
        coords = tsne.fit_transform(embeddings)
    except Exception as e:
        print(f'  UYARI: t-SNE basarisiz: {e}')
        return

    participants = sorted(set(l['participant'] for l in sample_labels))
    colors_map = plt.cm.tab20(np.linspace(0, 1, max(len(participants), 1)))

    fig, axes = plt.subplots(1, 2, figsize=(16, 7))

    for i, code in enumerate(participants):
        mask = [j for j, l in enumerate(sample_labels)
                if l['participant'] == code and not l['is_forgery']]
        if mask:
            axes[0].scatter(coords[mask, 0], coords[mask, 1],
                          c=[colors_map[i]], label=code, s=30, alpha=0.7)
    axes[0].set_title('t-SNE: Katilimci Bazli')
    axes[0].legend(fontsize=7, ncol=2)
    axes[0].grid(True, alpha=0.3)

    shapes = sorted(set(l['shape'] for l in sample_labels))
    shape_colors = plt.cm.Set1(np.linspace(0, 1, max(len(shapes), 1)))
    for i, shape in enumerate(shapes):
        mask = [j for j, l in enumerate(sample_labels) if l['shape'] == shape]
        if mask:
            marker = 'x' if shape == FORGERY_FOLDER else 'o'
            axes[1].scatter(coords[mask, 0], coords[mask, 1],
                          c=[shape_colors[i]], label=shape, s=30, alpha=0.7, marker=marker)
    axes[1].set_title('t-SNE: Sekil Bazli')
    axes[1].legend(fontsize=8)
    axes[1].grid(True, alpha=0.3)

    plt.suptitle('t-SNE Embedding Gorselestirme', fontsize=14)
    plt.tight_layout()
    fig.savefig(os.path.join(report_dir, 'tsne_embeddings.png'), dpi=150)
    plt.close()
    print(f'  t-SNE kaydedildi.')


def cross_dataset_test(embedding_model, siamese_model, cross_dir, img_size, threshold, report_dir):
    """
    Baska bir veri setinde (CEDAR, GPDS, BHSig260) test.
    Beklenen format:
      cross_dir/
        genuine/ veya real/
          001_001.png, 001_002.png, ...  (kisi_ornek)
        forged/ veya forge/
          001_001.png, ...
    """
    from PIL import Image as PILImage

    print('\n' + '='*60)
    print('CROSS-DATASET TEST')
    print(f'  Dizin: {cross_dir}')
    print('='*60)

    cross_path = Path(cross_dir)
    if not cross_path.exists():
        print(f'  HATA: Dizin bulunamadi: {cross_dir}')
        return None

    genuine_dir = None
    forged_dir = None
    for d in cross_path.iterdir():
        if d.is_dir():
            name_low = d.name.lower()
            if name_low in ('genuine', 'real', 'gercek', 'original'):
                genuine_dir = d
            elif name_low in ('forged', 'forge', 'fake', 'sahte', 'taklit'):
                forged_dir = d

    if genuine_dir is None or forged_dir is None:
        print('  HATA: genuine/ ve forged/ klasorleri bulunamadi.')
        print(f'  Mevcut: {[d.name for d in cross_path.iterdir() if d.is_dir()]}')
        return None

    def load_imgs(directory):
        imgs = {}
        for f in sorted(directory.glob('*.*')):
            if f.suffix.lower() in ('.png', '.jpg', '.jpeg'):
                parts = f.stem.split('_')
                person = parts[0] if parts else f.stem
                try:
                    img = PILImage.open(f).convert('RGB').resize((img_size, img_size), PILImage.LANCZOS)
                    arr = np.array(img, dtype=np.float32) / 255.0
                    if person not in imgs:
                        imgs[person] = []
                    imgs[person].append(arr)
                except Exception:
                    pass
        return imgs

    genuine_imgs = load_imgs(genuine_dir)
    forged_imgs = load_imgs(forged_dir)

    print(f'  Genuine: {sum(len(v) for v in genuine_imgs.values())} goruntu, {len(genuine_imgs)} kisi')
    print(f'  Forged : {sum(len(v) for v in forged_imgs.values())} goruntu, {len(forged_imgs)} kisi')

    pairs_1, pairs_2, pair_labels = [], [], []

    for person, imgs_list in genuine_imgs.items():
        if len(imgs_list) < 2:
            continue
        combos = list(itertools.combinations(range(len(imgs_list)), 2))
        random.shuffle(combos)
        for i1, i2 in combos[:50]:
            pairs_1.append(imgs_list[i1])
            pairs_2.append(imgs_list[i2])
            pair_labels.append(0)

    for person in set(genuine_imgs.keys()) & set(forged_imgs.keys()):
        for gi in genuine_imgs[person][:10]:
            for fi in forged_imgs[person][:10]:
                pairs_1.append(gi)
                pairs_2.append(fi)
                pair_labels.append(1)

    if len(pair_labels) == 0:
        print('  HATA: Cift olusturulamadi.')
        return None

    pairs_1 = np.array(pairs_1)
    pairs_2 = np.array(pairs_2)
    pair_labels = np.array(pair_labels)

    distances = siamese_model.predict([pairs_1, pairs_2], verbose=0).flatten()
    y_pred = (distances > threshold).astype(int)

    from sklearn.metrics import accuracy_score, f1_score, roc_auc_score
    acc = accuracy_score(pair_labels, y_pred)
    f1 = f1_score(pair_labels, y_pred, zero_division=0)
    auc = roc_auc_score(pair_labels, distances) if len(set(pair_labels)) > 1 else 0

    eer, eer_t, _, _, _ = compute_eer(pair_labels, distances)

    result = {
        'dataset': str(cross_dir),
        'n_pairs': len(pair_labels),
        'n_genuine': int(np.sum(pair_labels == 0)),
        'n_forged': int(np.sum(pair_labels == 1)),
        'accuracy': round(float(acc), 4),
        'f1': round(float(f1), 4),
        'auc_roc': round(float(auc), 4),
        'eer': round(float(eer), 4),
    }

    print(f'\n  Cross-dataset sonuclar:')
    print(f'    Accuracy : {acc*100:.2f}%')
    print(f'    F1       : {f1*100:.2f}%')
    print(f'    AUC-ROC  : {auc:.4f}')
    print(f'    EER      : {eer*100:.2f}%')

    return result


def run_loocv(images, labels, participant_codes, args):
    import tensorflow as tf

    print('\n' + '='*60)
    print('LOOCV — Leave-One-Out Cross Validation')
    print(f'  Katilimci: {len(participant_codes)}')
    print('='*60)

    all_results = []

    for i, test_person in enumerate(participant_codes):
        print(f'\n--- Fold {i+1}/{len(participant_codes)}: Test={test_person} ---')
        train_codes = set(participant_codes) - {test_person}
        val_person = sorted(train_codes)[-1]
        train_codes_final = train_codes - {val_person}

        pairs_tr, labels_tr, _ = create_pairs_for_participants(
            images, labels, train_codes_final, args.max_pairs, args.seed + i)
        pairs_va, labels_va, _ = create_pairs_for_participants(
            images, labels, {val_person}, args.max_pairs, args.seed + i + 100)
        pairs_te, labels_te, ptypes = create_pairs_for_participants(
            images, labels, {test_person}, args.max_pairs, args.seed + i + 200)

        if len(labels_tr) == 0 or len(labels_te) == 0:
            print(f'  ATLANDI: Yeterli cift yok.')
            continue

        tf.keras.backend.clear_session()
        emb_model, inp_shape = build_embedding_network(args.img_size, args.backbone)
        if args.loss == 'contrastive':
            model = build_siamese_contrastive(emb_model, inp_shape, args.lr, args.margin)
        else:
            model = build_siamese_triplet(emb_model, inp_shape, args.lr, args.margin)

        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
        cbs = [
            EarlyStopping(patience=8, restore_best_weights=True, monitor='val_loss'),
            ReduceLROnPlateau(factor=0.5, patience=4, min_lr=1e-6, monitor='val_loss'),
        ]

        if len(labels_va) > 0:
            model.fit(list(pairs_tr), labels_tr,
                      validation_data=(list(pairs_va), labels_va),
                      epochs=args.epochs, batch_size=args.batch, callbacks=cbs, verbose=0)
        else:
            model.fit(list(pairs_tr), labels_tr,
                      epochs=args.epochs, batch_size=args.batch, verbose=0)

        report, _ = evaluate_model(model, list(pairs_te), labels_te, ptypes, args.loss)
        report['test_person'] = test_person
        report['fold'] = i + 1
        all_results.append(report)

    if all_results:
        print('\n' + '='*60)
        print('LOOCV OZET')
        print('='*60)
        for key in ['eer', 'accuracy', 'f1', 'auc_roc', 'far', 'frr', 'cohens_kappa']:
            vals = [r[key] for r in all_results if key in r]
            if vals:
                print(f'  {key:15s}: {np.mean(vals)*100:.2f}% +/- {np.std(vals)*100:.2f}%')

    return all_results


def main():
    args = parse_args()

    if args.all:
        args.augment = True
        args.preprocess = True
        args.gradcam = True
        args.adversarial = True
        args.tsne = True
        args.temp_scaling = True

    random.seed(args.seed)
    np.random.seed(args.seed)

    import tensorflow as tf
    tf.random.set_seed(args.seed)

    print('='*60)
    print('ChiroBench — Siamese CNN Egitim (v3.0)')
    print('='*60)
    print(f'  Omurga         : {args.backbone}')
    print(f'  Loss           : {args.loss}')
    print(f'  Epoch          : {args.epochs}')
    print(f'  Batch          : {args.batch}')
    print(f'  LR             : {args.lr}')
    print(f'  Margin         : {args.margin}')
    print(f'  Goruntu        : {args.img_size}x{args.img_size}')
    print(f'  Augmentation   : {args.augment}')
    print(f'  Preprocessing  : {args.preprocess}')
    print(f'  Mod            : {"LOOCV" if args.loocv else "Writer-Independent"}')
    print(f'  Grad-CAM       : {args.gradcam}')
    print(f'  Adversarial    : {args.adversarial}')
    print(f'  t-SNE          : {args.tsne}')
    print(f'  Temp Scaling   : {args.temp_scaling}')
    print(f'  Cross-dataset  : {args.cross_dataset or "yok"}')

    images, labels, participant_codes, dataset_stats = load_dataset(
        args.dataset, args.img_size, args.preprocess, args.augment)

    if len(images) == 0:
        print('HATA: Veri bulunamadi!')
        sys.exit(1)

    if len(participant_codes) < 3:
        print(f'\nUYARI: Sadece {len(participant_codes)} katilimci.')
        if len(participant_codes) >= 2:
            print('LOOCV moduna geciliyor...')
            args.loocv = True
        else:
            print('HATA: En az 2 katilimci gerekir!')
            sys.exit(1)

    report_dir = os.path.dirname(args.report) or 'reports'
    os.makedirs(report_dir, exist_ok=True)

    if args.loocv:
        all_results = run_loocv(images, labels, participant_codes, args)
        final_report = {
            'mode': 'LOOCV',
            'version': '3.0',
            'n_participants': len(participant_codes),
            'participants': participant_codes,
            'backbone': args.backbone,
            'loss': args.loss,
            'img_size': args.img_size,
            'augmentation': args.augment,
            'preprocessing': args.preprocess,
            'folds': all_results,
        }
        with open(args.report, 'w', encoding='utf-8') as f:
            json.dump(final_report, f, indent=2, ensure_ascii=False)
        print(f'\n  LOOCV raporu: {args.report}')
        return

    train_codes, val_codes, test_codes = writer_independent_split(
        participant_codes, args.split_ratio, args.seed)

    if args.loss == 'contrastive':
        print('\n  Cift olusturuluyor (train)...')
        pairs_tr, labels_tr, _ = create_pairs_for_participants(
            images, labels, train_codes, args.max_pairs, args.seed)
        print('  Cift olusturuluyor (val)...')
        pairs_va, labels_va, _ = create_pairs_for_participants(
            images, labels, val_codes, args.max_pairs, args.seed + 100)
        print('  Cift olusturuluyor (test)...')
        pairs_te, labels_te, pair_types_te = create_pairs_for_participants(
            images, labels, test_codes, args.max_pairs, args.seed + 200)
    else:
        print('\n  Triplet olusturuluyor (train)...')
        triplets_tr = create_triplets_for_participants(
            images, labels, train_codes, args.max_pairs * 4, args.seed)
        print('  Triplet olusturuluyor (val)...')
        triplets_va = create_triplets_for_participants(
            images, labels, val_codes, args.max_pairs * 2, args.seed + 100)
        print('  Cift olusturuluyor (test — contrastive eval)...')
        pairs_te, labels_te, pair_types_te = create_pairs_for_participants(
            images, labels, test_codes, args.max_pairs, args.seed + 200)

    emb_model, inp_shape = build_embedding_network(args.img_size, args.backbone)

    if args.loss == 'contrastive':
        model = build_siamese_contrastive(emb_model, inp_shape, args.lr, args.margin)
    else:
        model = build_siamese_triplet(emb_model, inp_shape, args.lr, args.margin)

    from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
    os.makedirs(os.path.dirname(args.output) or '.', exist_ok=True)
    callbacks = [
        EarlyStopping(patience=10, restore_best_weights=True, monitor='val_loss'),
        ReduceLROnPlateau(factor=0.5, patience=5, min_lr=1e-6, monitor='val_loss'),
        ModelCheckpoint(args.output.replace('.h5', '_best.h5'), save_best_only=True, monitor='val_loss'),
    ]

    print('\n  Egitim basliyor...')
    if args.loss == 'contrastive':
        history = model.fit(
            list(pairs_tr), labels_tr,
            validation_data=(list(pairs_va), labels_va),
            epochs=args.epochs, batch_size=args.batch, callbacks=callbacks, verbose=1)
    else:
        dummy_tr = np.zeros(len(triplets_tr[0]))
        dummy_va = np.zeros(len(triplets_va[0])) if len(triplets_va[0]) > 0 else None
        if dummy_va is not None:
            history = model.fit(
                list(triplets_tr), dummy_tr,
                validation_data=(list(triplets_va), dummy_va),
                epochs=args.epochs, batch_size=args.batch, callbacks=callbacks, verbose=1)
        else:
            history = model.fit(
                list(triplets_tr), dummy_tr,
                epochs=args.epochs, batch_size=args.batch, verbose=1)

    if args.loss == 'contrastive':
        eval_model = model
    else:
        eval_pairs = list(pairs_te)
        eval_model = model

    report, distances = evaluate_model(eval_model, list(pairs_te), labels_te, pair_types_te, args.loss)
    report['backbone'] = args.backbone
    report['loss_type'] = args.loss
    report['epochs_trained'] = len(history.history['loss'])
    report['img_size'] = args.img_size
    report['margin'] = args.margin
    report['augmentation'] = args.augment
    report['preprocessing'] = args.preprocess
    report['train_participants'] = sorted(train_codes)
    report['val_participants'] = sorted(val_codes)
    report['test_participants'] = sorted(test_codes)
    report['split_type'] = 'writer_independent'
    report['version'] = '3.0'
    report['dataset_stats'] = {
        'total_images': len(images),
        'genuine': dataset_stats['genuine'],
        'forgery': dataset_stats['forgery'],
        'n_participants': len(participant_codes),
        'shapes': dict(dataset_stats['per_shape']),
    }

    plot_results(history, labels_te, distances, report, report_dir)

    ece = plot_calibration(labels_te.astype(int), distances, report_dir)
    if ece is not None:
        report['ece'] = round(float(ece), 4)

    if args.temp_scaling:
        temp = temperature_scaling(labels_te.astype(int), distances, report_dir)
        report['optimal_temperature'] = round(float(temp), 4)

    if args.gradcam:
        test_imgs = pairs_te[0] if len(pairs_te[0]) > 0 else None
        if test_imgs is not None:
            generate_gradcam(emb_model, test_imgs, report_dir)

    if args.adversarial and args.loss == 'contrastive':
        adv_result = adversarial_test(model, emb_model, list(pairs_te), labels_te, report_dir)
        if adv_result:
            report['adversarial_test'] = adv_result

    if args.tsne:
        plot_tsne(emb_model, images, labels, report_dir)

    if args.cross_dataset:
        cross_result = cross_dataset_test(
            emb_model, model, args.cross_dataset, args.img_size,
            report['threshold_used'], report_dir)
        if cross_result:
            report['cross_dataset_test'] = cross_result

    with open(args.report, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    print(f'\n  Rapor: {args.report}')

    model.save(args.output)
    emb_model.save(args.output.replace('.h5', '_embedding.h5'))
    print(f'  Model: {args.output}')

    try:
        import tf2onnx
        onnx_path = args.output.replace('.h5', '.onnx')
        model_proto, _ = tf2onnx.convert.from_keras(emb_model)
        with open(onnx_path, 'wb') as f:
            f.write(model_proto.SerializeToString())
        print(f'  ONNX: {onnx_path}')
    except ImportError:
        print('  ONNX atlandi (tf2onnx yok)')

    print('\n' + '='*60)
    print('SONUCLAR (v3.0)')
    print('='*60)
    print(f"  Split          : Writer-Independent")
    print(f"  Loss           : {args.loss}")
    print(f"  Augmentation   : {args.augment}")
    print(f"  Preprocessing  : {args.preprocess}")
    print(f"  Train          : {sorted(train_codes)}")
    print(f"  Test           : {sorted(test_codes)}")
    print(f"  EER            : {report['eer']*100:.2f}%")
    print(f"  Accuracy       : {report['accuracy']*100:.2f}%")
    print(f"  Sensitivity    : {report['sensitivity']*100:.2f}%")
    print(f"  Specificity    : {report['specificity']*100:.2f}%")
    print(f"  AUC-ROC        : {report['auc_roc']:.4f}")
    print(f"  F1             : {report['f1']*100:.2f}%")
    print(f"  FAR            : {report['far']*100:.2f}%")
    print(f"  FRR            : {report['frr']*100:.2f}%")
    print(f"  Cohen Kappa    : {report['cohens_kappa']:.4f}")
    if 'ece' in report:
        print(f"  ECE            : {report['ece']:.4f}")
    if 'optimal_temperature' in report:
        print(f"  Temperature    : {report['optimal_temperature']:.2f}")
    if 'adversarial_test' in report:
        print(f"  Adv. Acc Drop  : {report['adversarial_test']['accuracy_drop']*100:.2f}%")
    print('='*60)


if __name__ == '__main__':
    main()
