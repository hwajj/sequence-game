// atoms/gameStateAtom.js
import { atom } from "jotai";

export const currentTurnAtom = atom(null); // 현재 플레이어의 차례
export const boardStateAtom = atom([]); // 게임 보드의 상태
export const deckAtom = atom([]); // 남은 카드 덱 상태
export const playerCardsAtom = atom([]); // 각 플레이어가 가진 카드 상태
export const winnerAtom = atom(null); // 승리한 팀

export const playersAtom = atom([]);
