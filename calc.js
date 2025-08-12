'use strict';

document.addEventListener('DOMContentLoaded', function() {
  // --- 計算機関連 ---
  const calcDisplay = document.getElementById('calcDisplay');
  const calcError = document.getElementById('calcError');
  const calcKeypad = document.getElementById('calcKeypad');
  const calcClear = document.getElementById('calcClear');
  const calcEqual = document.getElementById('calcEqual');
  const rateInput = document.getElementById('rateInput');
  const fetchRateBtn = document.getElementById('fetchRateBtn');
  const toYenBtn = document.getElementById('toYenBtn');
  const toUsdBtn = document.getElementById('toUsdBtn');

  let calcInput = "";

  function updateCalcDisplay() {
    calcDisplay.textContent = calcInput || "0";
  }
  function clearCalcError() {
    calcError.innerHTML = '&nbsp;';
  }
  function showCalcError(msg) {
    calcError.textContent = msg;
  }

  // 数字ボタン
  calcKeypad.querySelectorAll('.num').forEach(btn => {
    btn.onclick = function() {
      calcInput += btn.textContent;
      updateCalcDisplay();
      clearCalcError();
    };
  });
  // 演算子ボタン
  calcKeypad.querySelectorAll('.op').forEach(btn => {
    btn.onclick = function() {
      // 直前に演算子がない場合のみ追加
      if (calcInput && !/[\+\-\*\/]$/.test(calcInput)) {
        calcInput += btn.getAttribute('data-op');
        updateCalcDisplay();
        clearCalcError();
      }
    };
  });
  // クリア
  calcClear.onclick = function() {
    calcInput = "";
    updateCalcDisplay();
    clearCalcError();
  };
  // イコール
  calcEqual.onclick = function() {
    try {
      // 全角記号を半角に変換してからeval
      let expr = calcInput.replace(/÷/g, '/').replace(/×/g, '*').replace(/−/g, '-').replace(/＋/g, '+');
      let result = eval(expr);
      if (typeof result === "number" && isFinite(result)) {
        calcInput = result.toString();
        updateCalcDisplay();
      } else {
        throw new Error();
      }
      clearCalcError();
    } catch {
      showCalcError("計算式が正しくありません");
    }
  };

  // 最新レート取得
  fetchRateBtn.onclick = function() {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then(res => res.json())
      .then(data => {
        if (data && data.rates && data.rates.JPY) {
          rateInput.value = data.rates.JPY;
        } else {
          showCalcError('為替レートの取得に失敗しました');
        }
      })
      .catch(() => {
        showCalcError('為替レートの取得に失敗しました');
      });
  };

  // 為替変換
  toYenBtn.onclick = function() {
    const rate = parseFloat(rateInput.value);
    const usd = parseFloat(calcInput);
    if (isNaN(rate) || rate <= 0) {
      showCalcError("為替レートを入力してください");
      return;
    }
    if (isNaN(usd)) {
      showCalcError("数値を入力してください");
      return;
    }
    calcInput = (usd * rate).toFixed(2);
    updateCalcDisplay();
    clearCalcError();
  };
  toUsdBtn.onclick = function() {
    const rate = parseFloat(rateInput.value);
    const yen = parseFloat(calcInput);
    if (isNaN(rate) || rate <= 0) {
      showCalcError("為替レートを入力してください");
      return;
    }
    if (isNaN(yen)) {
      showCalcError("数値を入力してください");
      return;
    }
    calcInput = (yen / rate).toFixed(2);
    updateCalcDisplay();
    clearCalcError();
  };
});