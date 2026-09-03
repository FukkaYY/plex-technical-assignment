import { expect, test } from "@playwright/test";

test("企業が送信したメッセージを対象学生が受信できる", async ({ page }) => {
  const messageBody = "E2Eテストから送信したスカウトメッセージです。";
  const targetStudentName = "デモ学生 25";
  const targetStudentEmail = "student25@example.com";
  const jobTitle = `E2E募集 ${Date.now()}`;
  const scheduleNote = `E2E面談 ${Date.now()}`;

  await page.goto("/");
  await page.getByRole("link", { name: "企業ログイン" }).click();
  await page.getByLabel("メールアドレス").fill("company@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/students$/);
  await page.getByRole("link", { name: "募集を管理" }).click();
  await page.getByRole("link", { name: "新しい募集を作成" }).click();
  await page.getByLabel("タイトル").fill(jobTitle);
  await page.getByLabel("募集職種").fill("バックエンドエンジニア");
  await page.getByLabel("勤務地・勤務形態").fill("東京都・リモート可");
  await page.getByLabel("募集内容").fill("E2Eで作成した募集内容です。");
  await page.getByLabel("応募条件").fill("Rubyの学習経験");
  await page.getByRole("button", { name: "募集を公開" }).click();
  await expect(page.getByRole("status")).toHaveText("募集を公開しました。");
  await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible();
  await page.getByRole("link", { name: "学生一覧へ戻る" }).click();

  await page.getByLabel("キーワード").fill("Rails");
  await page.getByLabel("卒業予定年").fill(String(new Date().getFullYear() + 1));
  await page.getByRole("button", { name: "検索する" }).click();
  await expect(page).toHaveURL(/query=Rails/);
  await expect(page.getByText(/人が検索条件に一致しました/)).toBeVisible();
  const studentCard = page.locator("article.student-card").filter({ hasText: targetStudentName });
  await expect(studentCard).toBeVisible();
  const studentDetailPath = await studentCard.getByRole("link", { name: "詳細を見る" }).getAttribute("href");
  if (!studentDetailPath) throw new Error("学生詳細へのリンクを取得できませんでした");
  await studentCard.getByRole("link", { name: "詳細を見る" }).click();
  await expect(page.getByRole("heading", { name: targetStudentName })).toBeVisible();
  await page.getByRole("link", { name: "この学生にメッセージを送る" }).click();

  await page.getByLabel("メッセージ本文").fill(messageBody);
  await page.getByRole("button", { name: "メッセージを送信" }).click();
  await expect(page.getByLabel("会話履歴")).toContainText(messageBody);
  await page.getByLabel("開始日時（日本時間）").fill("2099-01-02T10:00");
  await page.getByLabel("終了日時（日本時間）").fill("2099-01-02T11:00");
  await page.getByLabel("実施方法・場所").fill("オンライン面談");
  await page.getByLabel("補足（任意）").fill(scheduleNote);
  await page.getByRole("button", { name: "面談予定を提案" }).click();
  const companySchedule = page.locator("article.schedule-card").filter({ hasText: scheduleNote });
  await expect(companySchedule.getByText("回答待ち", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "学生詳細へ戻る" }).click();
  await page.getByRole("link", { name: "学生一覧へ戻る" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "学生ログイン" }).click();
  await page.getByLabel("メールアドレス").fill(targetStudentEmail);
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/students\/me$/);

  await page.getByRole("link", { name: "プロフィールを編集" }).click();
  await page.getByLabel("希望職種").fill("E2E更新済みエンジニア");
  await page.getByRole("button", { name: "プロフィールを更新" }).click();
  await expect(page.getByRole("status")).toHaveText("プロフィールを更新しました。");
  await expect(page.getByText("E2E更新済みエンジニア", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "インターン募集を見る" }).click();
  const jobCard = page.locator("article.job-card").filter({ hasText: jobTitle });
  await expect(jobCard).toBeVisible();
  await jobCard.getByRole("link", { name: "募集詳細を見る" }).click();
  await expect(page.getByRole("heading", { name: jobTitle })).toBeVisible();
  await expect(page.getByText("E2Eで作成した募集内容です。")).toBeVisible();
  await page.getByRole("link", { name: "募集一覧へ戻る" }).click();
  await page.getByRole("link", { name: "学生マイページへ戻る" }).click();

  await page.getByRole("link", { name: "受信メッセージを見る" }).click();
  const conversation = page.getByRole("link", { name: /デモ企業株式会社/ });
  await expect(conversation).toContainText(messageBody);
  await expect(conversation.getByLabel(/未読 \d+件/)).toBeVisible();
  await conversation.click();
  await expect(page.getByRole("heading", { name: "デモ企業株式会社" })).toBeVisible();
  await expect(page.getByLabel("会話履歴")).toContainText(messageBody);
  const studentSchedule = page.locator("article.schedule-card").filter({ hasText: scheduleNote });
  await studentSchedule.getByRole("button", { name: "承諾する" }).click();
  await expect(studentSchedule.getByText("承諾", { exact: true })).toBeVisible();
  await page.getByLabel("返信本文").fill("E2Eテストからの返信です。");
  await page.getByRole("button", { name: "返信を送信" }).click();
  await expect(page.getByLabel("会話履歴")).toContainText("E2Eテストからの返信です。");
  await page.getByRole("link", { name: "受信メッセージへ戻る" }).click();
  await expect(page.getByRole("link", { name: /デモ企業株式会社/ }).getByText(/未読/)).toHaveCount(0);

  await page.goto("/students");
  await expect(page).toHaveURL(/\/students\/me$/);

  await page.getByRole("button", { name: "ログアウト" }).click();
  await page.getByRole("link", { name: "企業ログイン" }).click();
  await page.getByLabel("メールアドレス").fill("company@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/students$/);
  await page.getByRole("link", { name: "募集を管理" }).click();
  const companyJobCard = page.locator("article.job-card").filter({ hasText: jobTitle });
  await companyJobCard.getByRole("button", { name: "募集を終了" }).click();
  await expect(companyJobCard.getByText("募集終了", { exact: true })).toBeVisible();
  await page.goto(`${studentDetailPath}/messages`);
  await expect(page.getByLabel("会話履歴")).toContainText("E2Eテストからの返信です。");
  const acceptedSchedule = page.locator("article.schedule-card").filter({ hasText: scheduleNote });
  await expect(acceptedSchedule.getByText("承諾", { exact: true })).toBeVisible();
});
