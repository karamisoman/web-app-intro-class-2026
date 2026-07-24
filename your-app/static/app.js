/**
 * TODO App JavaScript - 完成版
 * 第8回: セキュリティの基礎 & 総仕上げ
 *
 * 【このファイルの役割】
 *  ブラウザの画面（HTML）と、バックエンド（main.py）の橋渡しをする。
 *
 * 【全体の流れ】
 *  1. ページが開かれる → loadTodos() でサーバーからTODO一覧を取得
 *  2. renderTodos() が、取得したデータを画面のリストとして描画する
 *  3. ユーザーが「追加・チェック・削除」を操作する
 *     → 対応する関数がサーバーに変更を送る（fetch）
 *     → 最後にもう一度 loadTodos() して、最新の状態を画面に反映する
 *
 * ※ fetch はサーバーと通信する命令。通信は時間がかかるので、
 *   async / await を使って「結果が返ってくるまで待つ」書き方をしている。
 */

// サーバー側のAPIのアドレス（main.py の @app.get("/todos") などに対応）
const API_URL = "/animes";

/**
 * アニメ一覧を取得して描画する
 */
async function loadAnimes() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "アニメ一覧の取得に失敗しました");
      return;
    }

    const animes = await response.json();
    renderAnimes(animes);
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 新しいアニメを追加する（FormDataを使用）
 */
async function addAnime() {
  const input = document.getElementById("anime-input");
  const memoInput = document.getElementById("anime-memo");
  const imageInput = document.getElementById("anime-image");

  const title = input.value.trim();
  const memo = memoInput.value.trim();

  if (title === "") {
    showError("アニメのタイトルを入力してください");
    return;
  }

  const formData = new FormData();
  formData.append("title", title);
  formData.append("memo", memo);
  if (imageInput.files[0]) {
    formData.append("image", imageInput.files[0]);
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      body: formData, // FormDataを送る時は headers の Content-Type は自動設定させるため入れない
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "アニメの追加に失敗しました");
      return;
    }

    // フォームを空にする
    input.value = "";
    memoInput.value = "";
    imageInput.value = "";

    await loadAnimes();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * 視聴状態（視聴完了か否か）を切り替える
 */
async function toggleAnime(id, currentFinished, memo) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ finished: !currentFinished, memo: memo || "" }),
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "視聴状態の更新に失敗しました");
      return;
    }

    await loadAnimes();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

/**
 * アニメを削除する
 */
async function deleteAnime(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      showError(error.detail || "アニメの削除に失敗しました");
      return;
    }

    await loadAnimes();
  } catch (error) {
    showError("通信エラーが発生しました");
  }
}

// ============================================================
// 描画
// ============================================================

function renderAnimes(animes) {
  const list = document.getElementById("anime-list");
  list.innerHTML = "";

  animes.forEach((anime) => {
    const isFinished = Boolean(anime.finished);
    const li = document.createElement("li");
    li.className = "anime-item" + (isFinished ? " finished" : "");

    // 画像があれば表示
    if (anime.image_url) {
      const img = document.createElement("img");
      img.src = anime.image_url;
      img.className = "anime-thumbnail";
      li.appendChild(img);
    }

    const contentDiv = document.createElement("div");
    contentDiv.className = "anime-content";

    const label = document.createElement("label");
    label.className = "anime-label";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "anime-checkbox";
    checkbox.checked = isFinished;
    checkbox.addEventListener("change", () => toggleAnime(anime.id, isFinished, anime.memo));

    const titleSpan = document.createElement("span");
    titleSpan.className = "anime-title";
    titleSpan.textContent = anime.title;

    label.appendChild(checkbox);
    label.appendChild(titleSpan);
    contentDiv.appendChild(label);

    // 感想・メモがあれば表示
    if (anime.memo) {
      const memoP = document.createElement("p");
      memoP.className = "anime-memo-text";
      memoP.textContent = anime.memo;
      contentDiv.appendChild(memoP);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => deleteAnime(anime.id));

    li.appendChild(contentDiv);
    li.appendChild(deleteBtn);

    list.appendChild(li);
  });
}

// ============================================================
// メッセージ表示
// ============================================================

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

// ============================================================
// イベントリスナー
// ============================================================

document.getElementById("anime-form").addEventListener("submit", function (e) {
  e.preventDefault();
  addAnime();
});

// ページ読み込み時にアニメ一覧を取得
loadAnimes();