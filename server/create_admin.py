from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv
from app.models import Admin
from passlib.context import CryptContext

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# Настройка хэширования
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def get_password_hash(password):
    return pwd_context.hash(password)

def create_first_admin():
    db = SessionLocal()
    
    # Проверяем, есть ли уже админы
    existing_admin = db.query(Admin).first()
    if existing_admin:
        print("⚠️  Admin уже существует:")
        print(f"   Username: {existing_admin.username}")
        print(f"   Email: {existing_admin.email}")
        db.close()
        return
    
    # Создаём первого админа
    admin = Admin(
        username="admin1",
        email="admin1@moodboard.com",
        password_hash=get_password_hash("admiNN!12"),
        is_active=True
    )
    
    db.add(admin)
    db.commit()
    db.refresh(admin)
    print(" Admin создан успешно!")
    print(f"   Username: admin1")
    print(f"   Password: admiNN!12")
    print(f"   Email: {admin.email}")
    db.close()

if __name__ == "__main__":
    create_first_admin()