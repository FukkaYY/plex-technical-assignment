import { expect, test } from "@playwright/test";

test("企業が送信したメッセージを対象学生が受信できる", async ({ page }) => {
  const messageBody = "E2Eテストから送信したスカウトメッセージです。";

  await page.goto("/");
  await page.getByRole("link", { name: "企業ログイン" }).click();
  await page.getByLabel("メールアドレス").fill("company@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();

  await expect(page).toHaveURL(/\/students$/);
  const studentCard = page.locator("article.student-card").filter({ hasText: "デモ学生 01" });
  await expect(studentCard).toBeVisible();
  await studentCard.getByRole("link", { name: "詳細を見る" }).click();
  await expect(page.getByRole("heading", { name: "デモ学生 01" })).toBeVisible();
  await page.getByRole("link", { name: "この学生にメッセージを送る" }).click();

  await page.getByLabel("メッセージ本文").fill(messageBody);
  await page.getByRole("button", { name: "メッセージを送信" }).click();
  await expect(page.getByLabel("送信履歴")).toContainText(messageBody);

  await page.getByRole("link", { name: "学生詳細へ戻る" }).click();
  await page.getByRole("link", { name: "学生一覧へ戻る" }).click();
  await page.getByRole("button", { name: "ログアウト" }).click();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole("link", { name: "学生ログイン" }).click();
  await page.getByLabel("メールアドレス").fill("student01@example.com");
  await page.getByLabel("パスワード").fill("password123");
  await page.getByRole("button", { name: "ログイン" }).click();
  await expect(page).toHaveURL(/\/students\/me$/);

  await page.getByRole("link", { name: "受信メッセージを見る" }).click();
  const conversation = page.getByRole("link", { name: /デモ企業株式会社/ });
  await expect(conversation).toContainText(messageBody);
  await conversation.click();
  await expect(page.getByRole("heading", { name: "デモ企業株式会社" })).toBeVisible();
  await expect(page.getByLabel("受信メッセージ履歴")).toContainText(messageBody);

  await page.goto("/students");
  await expect(page).toHaveURL(/\/students\/me$/);
});
