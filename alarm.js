'use strict';

document.addEventListener('DOMContentLoaded', function() {
  // --- アラーム関連 ---
  const alarmDisplay = document.getElementById('alarmDisplay');
  const alarmError = document.getElementById('alarmError');
  const alarmKeypad = document.getElementById('alarmKeypad');
  const alarmOK = document.getElementById('alarmOK');
  const alarmTimeDisplay = document.getElementById('alarmTimeDisplay');
  const clearAlarmButton = document.getElementById('clearAlarmButton');
  const alarmClear = document.getElementById('alarmClear');
  const alarmSound = document.getElementById('alarmSound');

  // 区分ボタン取得
  const morningBtn = document.getElementById('morningBtn');
  const noonBtn = document.getElementById('noonBtn');
  const nightBtn = document.getElementById('nightBtn');
  const midnightBtn = document.getElementById('midnightBtn'); // 夜中は最後

  // 数字ボタン配列
  const numButtons = Array.from(alarmKeypad.querySelectorAll('.num'));

  // 区分ごとの有効な「時」の十の位セット
  const zoneValidFirstDigits = {
    morning:  ['0', '1'],               // 04〜10時
    noon:     ['1'],                    // 11〜17時
    night:    ['1', '2'],               // 18〜23時
    midnight: ['0', '1', '2', '3'],     // 0〜3時
  };

  let alarmInput = "";
  let alarmTime = null;
  let alarmTriggered = false;
  let alarmZone = null; // 区分

  // 12時間制＋AM/PM正しい変換
  function to12HourCustom(hour24, minute, zone) {
    let ampm = (hour24 < 12) ? '午前' : '午後';
    let hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    let minStr = minute.toString().padStart(2, '0');
    return `${hour12}:${minStr} ${ampm}`;
  }

  // 区分選択
  function selectZone(zone) {
    alarmZone = zone;
    morningBtn.classList.toggle('selected', zone === 'morning');
    noonBtn.classList.toggle('selected', zone === 'noon');
    nightBtn.classList.toggle('selected', zone === 'night');
    midnightBtn.classList.toggle('selected', zone === 'midnight');
    resetAlarmInput();
    updateNumButtonStates();
  }
  if(morningBtn) morningBtn.onclick = () => selectZone('morning');
  if(noonBtn) noonBtn.onclick = () => selectZone('noon');
  if(nightBtn) nightBtn.onclick = () => selectZone('night');
  if(midnightBtn) midnightBtn.onclick = () => selectZone('midnight');

  // 数字ボタンの有効/無効切り替え
  function updateNumButtonStates() {
    // 区分未選択なら全て無効
    if (!alarmZone) {
      numButtons.forEach(btn => btn.classList.add('disabled'));
      return;
    }
    // 入力が0桁目（時の十の位）
    if (alarmInput.length === 0) {
      const validDigits = zoneValidFirstDigits[alarmZone];
      numButtons.forEach(btn => {
        if (validDigits.includes(btn.textContent)) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
      });
    } else if (alarmInput.length === 1) {
      // 2桁目（時の一の位）の制御
      const first = alarmInput[0];
      let validSeconds = [];
      if (alarmZone === 'morning') {
        // 04〜10時
        if (first === '0') validSeconds = ['4','5','6','7','8','9'];
        else if (first === '1') validSeconds = ['0'];
      } else if (alarmZone === 'noon') {
        // 11〜17時
        if (first === '1') validSeconds = ['1','2','3','4','5','6','7'];
      } else if (alarmZone === 'night') {
        // 18〜23時
        if (first === '1') validSeconds = ['8','9'];
        else if (first === '2') validSeconds = ['0','1','2','3'];
      } else if (alarmZone === 'midnight') {
        // 0〜3時
        if (first === '0') validSeconds = ['0','1','2','3'];
        else if (['1','2'].includes(first)) validSeconds = ['0','1','2','3','4','5','6','7','8','9'];
        else if (first === '3') validSeconds = ['0'];
      }
      numButtons.forEach(btn => {
        if (validSeconds && validSeconds.includes(btn.textContent)) {
          btn.classList.remove('disabled');
        } else {
          btn.classList.add('disabled');
        }
      });
    } else {
      // 3桁目以降（分）は全て有効
      numButtons.forEach(btn => btn.classList.remove('disabled'));
    }
  }

  // 入力表示
  function updateAlarmDisplay() {
    // 区分未選択時は空白表示
    if (!alarmZone) {
      alarmDisplay.textContent = '';
      return;
    }
    let padded = alarmInput.padStart(4, '0');
    let hour24 = parseInt(padded.slice(0, 2), 10);
    let min = parseInt(padded.slice(2, 4), 10);

    // 昼区分で1～5時なら自動で13～17時に補正
    if (alarmZone === "noon" && hour24 >= 1 && hour24 <= 5) {
      hour24 += 12;
      padded = hour24.toString().padStart(2, '0') + padded.slice(2, 4);
      alarmInput = padded;
    }

    if (isNaN(hour24) || isNaN(min)) {
      alarmDisplay.textContent = '--:--';
      return;
    }
    alarmDisplay.textContent = to12HourCustom(hour24, min, alarmZone);
  }

  // 入力リセット
  function resetAlarmInput() {
    alarmInput = "";
    updateAlarmDisplay();
    alarmError.textContent = '';
    updateNumButtonStates();
  }

  // キーパッド入力（無効ボタンは押せない）
  numButtons.forEach(btn => {
    btn.onclick = function() {
      if(alarmInput.length < 4 && !btn.classList.contains('disabled')) {
        alarmInput += btn.textContent;
        updateAlarmDisplay();
        alarmError.textContent = '';
        updateNumButtonStates();
      }
    };
  });

  // クリアボタン
  if(alarmClear){
    alarmClear.onclick = resetAlarmInput;
  }

  // アラーム設定（上書き対応・区分バリデーション付き）
  alarmOK.onclick = function() {
    alarmError.textContent = '';
    if (!alarmZone) {
      alarmError.textContent = "「朝」「昼」「夜」「夜中」を選択してください";
      return;
    }
    let padded = alarmInput.padStart(4, '0');
    let hour24 = parseInt(padded.slice(0, 2), 10);
    let min = parseInt(padded.slice(2, 4), 10);

    // 昼区分で1～5時なら自動で13～17時に補正（OK時も念のため）
    if (alarmZone === "noon" && hour24 >= 1 && hour24 <= 5) {
      hour24 += 12;
      padded = hour24.toString().padStart(2, '0') + padded.slice(2, 4);
      alarmInput = padded;
    }

    // 区分ごとのバリデーション
    if (alarmZone === "midnight" && (hour24 < 0 || hour24 > 3)) {
      alarmError.textContent = "夜中は0～3時で入力してください";
      return;
    }
    if (alarmZone === "morning" && (hour24 < 4 || hour24 > 10)) {
      alarmError.textContent = "朝は4～10時で入力してください";
      return;
    }
    if (alarmZone === "noon" && (hour24 < 11 || hour24 > 17)) {
      alarmError.textContent = "昼は11～17時で入力してください";
      return;
    }
    if (alarmZone === "night" && (hour24 < 18 || hour24 > 23)) {
      alarmError.textContent = "夜は18～23時で入力してください";
      return;
    }
    if (isNaN(hour24) || isNaN(min) || min < 0 || min > 59) {
      alarmError.textContent = "正しい時刻を入力してください";
      return;
    }

    // 上書きメッセージ
    let overwriteMsg = alarmTime ? "<span style='color:orange;'>（前のアラームを上書きしました）</span><br>" : "";

    alarmTime = new Date();
    alarmTime.setHours(hour24);
    alarmTime.setMinutes(min);
    alarmTime.setSeconds(0);
    alarmTriggered = false;

    const zoneLabel = {morning: "朝", noon: "昼", night: "夜", midnight: "夜中"}[alarmZone];
    alarmTimeDisplay.innerHTML = `
      ${overwriteMsg}
      <span class="alarm-time-large">
        アラーム設定時刻：${zoneLabel} ${to12HourCustom(hour24, min, alarmZone)}
      </span>
      <div id="alarmActiveMsgContainer"></div>
    `;
    alarmTimeDisplay.style.display = 'block';
    clearAlarmButton.style.display = 'block';
    clearAlarmButton.textContent = '解除';
    clearAlarmButton.disabled = false;
  };

  // 解除
  clearAlarmButton.onclick = function() {
    alarmTime = null;
    alarmTimeDisplay.innerHTML = "";
    clearAlarmButton.style.display = 'none';
    alarmTriggered = false;
    if(alarmSound) {
      alarmSound.pause();
      alarmSound.currentTime = 0;
    }
  };

  // アラーム発動
  setInterval(() => {
    if (alarmTime && !alarmTriggered) {
      const now = new Date();
      if (
        now.getHours() === alarmTime.getHours() &&
        now.getMinutes() === alarmTime.getMinutes() &&
        now.getSeconds() === 0
      ) {
        alarmTriggered = true;
        if(alarmSound) alarmSound.play();
        document.getElementById('alarmActiveMsgContainer').innerHTML = `<div>アラーム時刻です！</div>`;
        clearAlarmButton.textContent = 'ストップ';
      }
    }
  }, 1000);

  // 初期表示
  updateAlarmDisplay();
  updateNumButtonStates();
});