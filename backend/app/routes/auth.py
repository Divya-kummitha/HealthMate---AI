from fastapi import APIRouter

router = APIRouter()

@router.post("/login")
def login(payload: dict):
    return {
        "userId": "user-101",
        "name": "Alex Rivera",
        "email": payload.get("email", "alex.rivera@university.edu"),
        "token": "demo-jwt-token-healthmate-ai",
    }

@router.post("/register")
def register(payload: dict):
    return {
        "userId": "user-101",
        "name": payload.get("name", "Alex Rivera"),
        "email": payload.get("email", "alex.rivera@university.edu"),
        "token": "demo-jwt-token-healthmate-ai",
    }
