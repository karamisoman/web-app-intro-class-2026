"""
TODOアプリ バックエンド - 完成版
第8回: セキュリティの基礎 & 総仕上げ
"""

import os
import sqlite3
import shutil
import uvicorn
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

app = FastAPI(title="アニメまとめ App")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE = "anime.db"
UPLOAD_DIR = "static/uploads"

# 画像保存用フォルダがなければ作成
os.makedirs(UPLOAD_DIR, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    # memo と image_url カラムを追加
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS animes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            finished INTEGER DEFAULT 0,
            memo TEXT DEFAULT '',
            image_url TEXT DEFAULT ''
        )
    """)
    conn.commit()
    conn.close()

class AnimeUpdate(BaseModel):
    finished: bool
    memo: str = ""

@app.get("/animes")
def get_animes():
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("SELECT id, title, finished, memo, image_url FROM animes ORDER BY id DESC")
    animes = cursor.fetchall()
    conn.close()
    return [
        {
            "id": anime[0],
            "title": anime[1],
            "finished": bool(anime[2]),
            "memo": anime[3] or "",
            "image_url": anime[4] or ""
        }
        for anime in animes
    ]

# フォームデータ（画像ファイル + テキスト）を受け取るPOST
@app.post("/animes", status_code=201)
async def create_anime(
    title: str = Form(...),
    memo: str = Form(""),
    image: UploadFile = File(None)
):
    image_url = ""
    if image and image.filename:
        # 保存先ファイル名を決定（重複防止にIDや元のファイル名を使用）
        file_path = os.path.join(UPLOAD_DIR, image.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(image.file, buffer)
        image_url = f"/uploads/{image.filename}"

    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO animes (title, finished, memo, image_url) VALUES (?, 0, ?, ?)",
        (title, memo, image_url),
    )
    conn.commit()
    anime_id = cursor.lastrowid
    conn.close()

    return {
        "id": anime_id,
        "title": title,
        "finished": False,
        "memo": memo,
        "image_url": image_url
    }

@app.put("/animes/{anime_id}")
def update_anime(anime_id: int, anime: AnimeUpdate):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE animes SET finished = ?, memo = ? WHERE id = ?",
        (int(anime.finished), anime.memo, anime_id),
    )
    conn.commit()
    conn.close()
    return {"id": anime_id, "finished": anime.finished, "memo": anime.memo}

@app.delete("/animes/{anime_id}")
def delete_anime(anime_id: int):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM animes WHERE id = ?", (anime_id,))
    conn.commit()
    conn.close()
    return {"message": "Anime deleted", "id": anime_id}

app.mount("/", StaticFiles(directory="static", html=True), name="static")

init_db()

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)