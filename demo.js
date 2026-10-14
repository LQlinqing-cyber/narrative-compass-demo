// 仅操作预先生成的报告，不请求模型或后台接口。
const panels = [...document.querySelectorAll("[data-report-panel]")];
const source = document.querySelector("#source-text");

function selectReport(stage) {
  panels.forEach((panel) => { panel.hidden = panel.dataset.reportPanel !== String(stage); });
}

panels.forEach((panel) => {
  const tabs = [...panel.querySelectorAll("nav button")];
  tabs.forEach((button, index) => {
    button.classList.add("demo-tab");
    button.setAttribute("aria-pressed", String(index + 1 === Number(panel.dataset.reportPanel)));
    button.addEventListener("click", () => selectReport(index + 1));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const stage = event.key === "Home" ? 1 : event.key === "End" ? 5 : (index + (event.key === "ArrowRight" ? 1 : 4)) % 5 + 1;
      selectReport(stage);
      panels[stage - 1].querySelectorAll("nav button")[stage - 1].focus();
    });
  });
  panel.querySelectorAll("button").forEach((button) => {
    const text = button.textContent.trim();
    if (!text.startsWith("“") || !text.endsWith("”")) return;
    const quote = text.slice(1, -1);
    button.addEventListener("click", () => {
      const start = source.value.indexOf(quote);
      if (start < 0) return;
      source.focus();
      source.setSelectionRange(start, start + quote.length);
      source.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });
});

document.querySelectorAll("[data-compare]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-diff]").forEach((diff) => { diff.hidden = diff.dataset.diff !== button.dataset.compare; });
    document.querySelectorAll("[data-compare]").forEach((toggle) => toggle.setAttribute("aria-pressed", String(toggle === button)));
  });
});

document.querySelector("#copy-final").addEventListener("click", async () => {
  const final = document.querySelector("#final-text");
  const status = document.querySelector("#copy-status");
  try {
    await navigator.clipboard.writeText(final.value);
    status.textContent = "终稿已复制。";
  } catch {
    final.focus();
    final.select();
    status.textContent = "自动复制不可用，已选中终稿，请手动复制。";
  }
  status.hidden = false;
});
