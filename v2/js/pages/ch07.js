/* 第 07 章 */
import { head, pager } from "../ui.js";
import { pocketSectionHTML } from "../features/pocket.js";

export default function ch07(){
  return `${head("07")}
  <div class="note">🗺️ 有填地址的地點，地圖按鈕會直接用地址開啟；沒有地址時，會用「名稱＋地區」搜尋，可能出現多家分店，請自行確認。</div>
  ${pocketSectionHTML()}${pager("07")}`;
}
