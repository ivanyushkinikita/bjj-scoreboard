import { useSettingsStore } from '../stores/settingsStore';
import { competitionRu, competitionEn } from './rulesTranslations';
const ru: Record<string, string> = {
  'm':' мин', 'MM:SS':'ММ:СС', '↶ Undo':'↶ Отменить', '↷ Redo':'↷ Повторить', 'Confirm result →':'Подтвердить результат →',
  'Ctrl+Z · Undo &nbsp; Ctrl+Shift+Z · Redo':'Ctrl+Z · Отменить   Ctrl+Shift+Z · Повторить',
  'Sound asset could not be loaded':'Не удалось загрузить звуковой файл',
  'BJJ SCOREBOARD':'ТАБЛО ДЖИУ-ДЖИТСУ', 'LOCAL / OFFLINE':'ЛОКАЛЬНО / ОФЛАЙН', 'Shortcuts':'Клавиши', 'Keyboard shortcuts':'Горячие клавиши',
  'Open Scoreboard Display':'Открыть зрительское табло', 'Display settings':'Настройки табло', 'Settings':'Настройки', 'Language':'Язык',
  'READY FOR THE NEXT ROUND':'ГОТОВЫ К СЛЕДУЮЩЕЙ СХВАТКЕ', 'Every point.':'Каждый балл.', 'Every second.':'Каждая секунда.',
  'Set the match. Take control of the tatami.':'Настройте схватку. Управляйте происходящим на татами.', 'Offline. On your side.':'Без интернета. Всегда рядом.',
  'MATCH SETUP':'НАСТРОЙКА СХВАТКИ', 'Let’s step onto the mat.':'Время выйти на татами.', 'Competitor A · BLUE':'Спортсмен A · СИНИЙ', 'Competitor B · WHITE':'Спортсмен B · БЕЛЫЙ',
  'Competitor A':'Спортсмен A', 'Competitor B':'Спортсмен B', 'Athlete name':'Имя спортсмена', 'Match duration':'Длительность схватки',
  'Enter a duration from 00:01 to 999:59.':'Введите время от 00:01 до 999:59.', 'START MATCH':'СОЗДАТЬ СХВАТКУ', 'The timer starts when you’re ready.':'Запустите таймер, когда будете готовы.',
  'BLUE':'СИНИЙ', 'WHITE':'БЕЛЫЙ', 'BLUE · A':'СИНИЙ · A', 'WHITE · B':'БЕЛЫЙ · B', 'EDIT':'ИЗМЕНИТЬ', 'ADVANTAGES':'ПРЕИМУЩЕСТВА', 'PENALTIES':'ШТРАФЫ',
  'BJJ actions':'Приёмы BJJ', 'Takedown':'Перевод в партер', 'Sweep':'Свип', 'Knee on Belly':'Колено на животе', 'Guard Pass':'Проход гарда', 'Mount':'Маунт', 'Back Control':'Контроль спины',
  'points':'Баллы', 'Points':'Баллы', 'advantages':'Преимущество', 'penalties':'Штраф', 'Undo':'Отменить', 'Redo':'Повторить', 'History':'История',
  'MATCH COMPLETE':'СХВАТКА ЗАВЕРШЕНА', 'TIME EXPIRED':'ВРЕМЯ ИСТЕКЛО', 'WAITING FOR MATCH':'ОЖИДАНИЕ СХВАТКИ', 'READY':'ГОТОВНОСТЬ', 'RUNNING':'ИДЁТ СХВАТКА', 'PAUSED':'ПАУЗА',
  'Edit remaining time':'Изменить оставшееся время', 'FINAL RESULT':'ИТОГОВЫЙ РЕЗУЛЬТАТ', 'REVIEW & CONFIRM RESULT':'ПРОВЕРЬТЕ И ПОДТВЕРДИТЕ РЕЗУЛЬТАТ', 'MATCH CLOCK · CLICK TO ADJUST':'ТАЙМЕР · НАЖМИТЕ ДЛЯ ИЗМЕНЕНИЯ',
  'REFEREE DECISION':'РЕШЕНИЕ СУДЬИ', 'Preliminary result':'Предварительный результат', 'Confirm result':'Подтвердить результат', 'WINS':'ПОБЕЖДАЕТ', 'LEADS':'ЛИДИРУЕТ',
  'BY TIME':'ПО ВРЕМЕНИ', 'BY SUBMISSION':'САБМИШНОМ', 'BY DECISION':'ПО РЕШЕНИЮ СУДЬИ', 'PAUSE':'ПАУЗА', 'RESUME':'ПРОДОЛЖИТЬ', 'START TIMER':'ЗАПУСТИТЬ ТАЙМЕР', 'SPACE':'ПРОБЕЛ',
  'Reset timer':'Сбросить таймер', 'Submission':'Сабмишн', 'New match':'Новая схватка', 'PRECISION ON THE MAT.':'ТОЧНОСТЬ НА ТАТАМИ.', 'TATAMI / MATCH CONTROL':'TATAMI / УПРАВЛЕНИЕ СХВАТКОЙ',
  'Welcome back to the mat':'С возвращением на татами', 'A previous match was saved locally.':'Предыдущая схватка сохранена на этом устройстве.',
  'Running clocks include the time elapsed while the application was closed.':'Если таймер работал, будет учтено время, прошедшее после закрытия приложения.',
  'START NEW MATCH':'НАЧАТЬ НОВУЮ СХВАТКУ', 'RESTORE PREVIOUS MATCH':'ВОССТАНОВИТЬ СХВАТКУ', 'Match history':'История схватки', 'Adjust remaining time':'Изменить оставшееся время',
  'Start a new match?':'Начать новую схватку?', 'Reset the match clock?':'Сбросить таймер схватки?', 'Submission victory':'Победа сабмишном', 'Confirm match result':'Подтвердить результат схватки',
  'Scoreboard display':'Зрительское табло', 'Close application?':'Закрыть приложение?', 'Edit competitor A':'Изменить спортсмена A', 'Edit competitor B':'Изменить спортсмена B', 'Close dialog':'Закрыть диалог',
  'Advantage +':'Преимущество +', 'Penalty +':'Штраф +', 'Space · Start / Pause / Resume':'Пробел · Старт / Пауза / Продолжить',
  'Ctrl+Z · Undo':'Ctrl+Z · Отменить', 'Ctrl+Shift+Z · Redo':'Ctrl+Shift+Z · Повторить', 'F11 · Control window fullscreen':'F11 · Полноэкранный режим окна управления',
  'Backspace · Reset timer (with confirmation)':'Backspace · Сброс таймера с подтверждением',
  'Shortcuts are disabled while editing or when a dialog is open. Escape only dismisses dialogs.':'Клавиши не действуют при вводе текста и в диалогах. Escape закрывает только диалог.',
  'Test end-of-match sound':'Проверить звук окончания', 'Test start sound':'Проверить звук старта', 'Sounds':'Звуки',
  'Play sound when the match timer starts':'Звук при первом запуске таймера', 'Play sound when time expires':'Звук по окончании времени',
  'Sound settings are saved on this device. Start sound plays on Start, not on Resume.':'Настройки сохраняются на этом устройстве. Звук старта звучит при первом запуске и после сброса таймера; при продолжении после паузы — нет.',
  'Remaining time · MM:SS':'Оставшееся время · ММ:СС', 'The clock keeps its current running or paused state.':'Таймер сохранит текущее состояние: отсчёт или паузу.',
  'Cancel':'Отмена', 'Confirm change':'Подтвердить изменение', 'Confirm':'Подтвердить',
  'Clear athletes, scores, history and timer, and return to setup?':'Очистить спортсменов, счёт, историю и таймер и вернуться к настройке?',
  'Reset the clock to {time} and stop it? Scores remain unchanged.':'Сбросить таймер на {time} и остановить его? Счёт сохранится.',
  'A match is currently running. Close application? Your match is saved, and a running clock continues to elapse.':'Схватка активна. Закрыть приложение? Данные сохранятся, а работающий таймер продолжит отсчёт.',
  'Select the winner, then confirm the result.':'Выберите победителя и подтвердите результат.', 'Confirm submission victory for {name}?':'Подтвердить победу сабмишном: {name}?',
  'Confirm victory for {name}?':'Подтвердить победу: {name}?', 'Confirm victory':'Подтвердить победу',
  'Move the spectator window to a monitor, then enable fullscreen.':'Переместите зрительское окно на нужный монитор и включите полноэкранный режим.',
  'Toggle display fullscreen':'Полноэкранное зрительское табло', 'Close display':'Закрыть табло', 'Available monitors':'Доступные мониторы', 'Select a monitor':'Выберите монитор', 'Monitor':'Монитор',
  'Monitor selection is available in the desktop application. You can also drag the display window manually.':'Выбор монитора доступен в desktop-приложении. Окно табло также можно перетащить вручную.',
  'Toggle control fullscreen':'Полноэкранное окно управления', 'No events yet.':'Событий пока нет.', 'MATCH':'СХВАТКА',
  'Match created':'Схватка создана', 'Time expired':'Время истекло', 'Timer paused':'Таймер приостановлен', 'Timer started':'Таймер запущен', 'Timer resumed':'Отсчёт продолжен',
  'Time adjusted (milliseconds)':'Время изменено (мс)', 'Timer reset':'Таймер сброшен', 'Victory by time':'Победа по времени', 'Victory by submission':'Победа сабмишном', 'Victory by decision':'Победа по решению судьи',
  'Name changed to':'Имя изменено на', 'Dismiss':'Закрыть',
  'The saved match could not be read. Start a new match to continue.':'Не удалось прочитать сохранённую схватку. Начните новую.',
  'Local save failed. Keep this window open until storage is available.':'Не удалось сохранить данные. Не закрывайте окно, пока хранилище не станет доступно.',
  'A {field} minus':'A: {field}, уменьшить', 'A {field} plus':'A: {field}, увеличить', 'B {field} minus':'B: {field}, уменьшить', 'B {field} plus':'B: {field}, увеличить',
  'A plus {n}':'A: плюс {n}', 'B plus {n}':'B: плюс {n}', 'Competitor {side} scoreboard':'Табло спортсмена {side}',
};
export function translate(text: string, locale: 'en' | 'ru', values: Record<string, string | number> = {}): string {
  let result = locale === 'ru' ? competitionRu[text] || ru[text] || text : competitionEn[text] || text;
  for (const [key,value] of Object.entries(values)) result = result.replaceAll(`{${key}}`, String(value));
  return result;
}
export function useTranslation() {
  const locale = useSettingsStore(s => s.settings.locale);
  return { locale, t: (text: string, values?: Record<string, string | number>) => translate(text, locale, values) };
}
export function eventLabel(label: string, locale: 'en' | 'ru'): string {
  for (const prefix of ['Undo · ', 'Redo · ', 'Name changed to ']) {
    if (label.startsWith(prefix)) return `${translate(prefix.trim().replace(' ·',''),locale)}${prefix.includes('·') ? ' · ' : ' '}${prefix.includes('·') ? translate(label.slice(prefix.length),locale) : label.slice(prefix.length)}`;
  }
  return translate(label, locale);
}
