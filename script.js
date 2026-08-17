(() => {
  const expressionEl = document.getElementById("expression");
  const resultEl = document.getElementById("result");

  let current = "0";
  let previous = null;
  let operator = null;
  let shouldReset = false;
  let lastExpression = "";

  const MAX_LEN = 14;

  function formatNumber(value) {
    if (value === "Error" || value === "∞") return value;
    const num = Number(value);
    if (!Number.isFinite(num)) return "Error";

    const abs = Math.abs(num);
    if (abs !== 0 && (abs >= 1e12 || abs < 1e-8)) {
      return num.toExponential(6).replace(/\.?0+e/, "e");
    }

    const str = String(num);
    if (str.includes("e")) return str;

    const [intPart, decPart] = str.split(".");
    const withSep = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return decPart !== undefined ? `${withSep}.${decPart}` : withSep;
  }

  function updateDisplay() {
    resultEl.textContent = formatNumber(current);
    resultEl.classList.toggle("error", current === "Error");

    if (previous !== null && operator) {
      expressionEl.textContent = `${formatNumber(previous)} ${operator}${
        shouldReset ? "" : " " + formatNumber(current)
      }`;
    } else if (lastExpression) {
      expressionEl.textContent = lastExpression;
    } else {
      expressionEl.textContent = "";
    }
  }

  function inputDigit(digit) {
    if (current === "Error") clearAll();

    if (shouldReset) {
      current = digit;
      shouldReset = false;
    } else if (current === "0" && digit !== ".") {
      current = digit;
    } else {
      const plain = current.replace("-", "").replace(".", "");
      if (plain.length >= MAX_LEN) return;
      current += digit;
    }
    lastExpression = "";
    updateDisplay();
  }

  function inputDecimal() {
    if (current === "Error") clearAll();
    if (shouldReset) {
      current = "0.";
      shouldReset = false;
      lastExpression = "";
      updateDisplay();
      return;
    }
    if (!current.includes(".")) {
      current += ".";
      lastExpression = "";
      updateDisplay();
    }
  }

  function clearAll() {
    current = "0";
    previous = null;
    operator = null;
    shouldReset = false;
    lastExpression = "";
    updateDisplay();
  }

  function backspace() {
    if (current === "Error") {
      clearAll();
      return;
    }
    if (shouldReset) return;
    if (current.length <= 1 || (current.length === 2 && current.startsWith("-"))) {
      current = "0";
    } else {
      current = current.slice(0, -1);
    }
    updateDisplay();
  }

  function percent() {
    if (current === "Error") return;
    const n = parseFloat(current);
    if (!Number.isFinite(n)) return;
    current = String(n / 100);
    shouldReset = true;
    updateDisplay();
  }

  function compute(a, op, b) {
    const x = Number(a);
    const y = Number(b);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return "Error";

    let result;
    switch (op) {
      case "+":
        result = x + y;
        break;
      case "−":
        result = x - y;
        break;
      case "×":
        result = x * y;
        break;
      case "÷":
        if (y === 0) return "Error";
        result = x / y;
        break;
      default:
        return "Error";
    }

    if (!Number.isFinite(result)) return "Error";
    const rounded = Math.round(result * 1e12) / 1e12;
    return String(rounded);
  }

  function setOperator(nextOp) {
    if (current === "Error") return;

    if (previous !== null && operator && !shouldReset) {
      const res = compute(previous, operator, current);
      current = res;
      previous = res === "Error" ? null : res;
      operator = res === "Error" ? null : nextOp;
      shouldReset = true;
      lastExpression = "";
      updateDisplay();
      return;
    }

    previous = current;
    operator = nextOp;
    shouldReset = true;
    lastExpression = "";
    updateDisplay();
  }

  function equals() {
    if (current === "Error") return;
    if (previous === null || !operator) return;

    const a = previous;
    const b = current;
    const op = operator;
    const res = compute(a, op, b);

    lastExpression = `${formatNumber(a)} ${op} ${formatNumber(b)} =`;
    current = res;
    previous = null;
    operator = null;
    shouldReset = true;
    updateDisplay();
  }

  function flashKey(el) {
    if (!el) return;
    el.classList.add("pressed");
    setTimeout(() => el.classList.remove("pressed"), 120);
  }

  document.querySelector(".keys").addEventListener("click", (e) => {
    const btn = e.target.closest("button.key");
    if (!btn) return;

    flashKey(btn);

    if (btn.dataset.num !== undefined) {
      inputDigit(btn.dataset.num);
      return;
    }
    if (btn.dataset.op) {
      setOperator(btn.dataset.op);
      return;
    }

    switch (btn.dataset.action) {
      case "clear":
        clearAll();
        break;
      case "backspace":
        backspace();
        break;
      case "percent":
        percent();
        break;
      case "decimal":
        inputDecimal();
        break;
      case "equals":
        equals();
        break;
      default:
        break;
    }
  });

  const keyMap = {
    Escape: "clear",
    Backspace: "backspace",
    Enter: "equals",
    "=": "equals",
    "%": "percent",
    ".": "decimal",
    ",": "decimal",
    "+": "+",
    "-": "−",
    "*": "×",
    x: "×",
    X: "×",
    "/": "÷",
  };

  window.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;

    const k = e.key;

    if (/^[0-9]$/.test(k)) {
      e.preventDefault();
      inputDigit(k);
      flashKey(document.querySelector(`[data-num="${k}"]`));
      return;
    }

    const mapped = keyMap[k];
    if (!mapped) return;
    e.preventDefault();

    if (mapped === "+" || mapped === "−" || mapped === "×" || mapped === "÷") {
      setOperator(mapped);
      flashKey(document.querySelector(`[data-op="${mapped}"]`));
      return;
    }

    switch (mapped) {
      case "clear":
        clearAll();
        flashKey(document.querySelector('[data-action="clear"]'));
        break;
      case "backspace":
        backspace();
        flashKey(document.querySelector('[data-action="backspace"]'));
        break;
      case "percent":
        percent();
        flashKey(document.querySelector('[data-action="percent"]'));
        break;
      case "decimal":
        inputDecimal();
        flashKey(document.querySelector('[data-action="decimal"]'));
        break;
      case "equals":
        equals();
        flashKey(document.querySelector('[data-action="equals"]'));
        break;
      default:
        break;
    }
  });

  updateDisplay();
})();
