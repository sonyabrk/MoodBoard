from app.database import engine, Base
from app import models

print("Создаю таблицы в базе данных...")
Base.metadata.create_all(bind=engine)
print("Таблицы созданы успешно!")
print("\nСозданные таблицы:")
print("  - admins")
print("  - frames")
print("  - tags")
print("  - frame_tag (связь многие-ко-многим)")