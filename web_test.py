try:
    import web_search
    print("web_search module found")
except ImportError:
    print("web_search module not found")

try:
    from replit_skills import webSearch
    print("webSearch imported from replit_skills")
except ImportError:
    print("webSearch not found in replit_skills")
