import { QUESTIONNAIRE } from "./questionnaire";
import type { Answer, BrideKey, PhotoItem, QPageState, SessionState } from "./types";

let idCounter = 0;
export function makeId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}

function emptyPage(key: string): QPageState {
  return { key, answers: {}, photos: [] };
}

/** ברירת מחדל מעורבת לסגנון התמונה — רוב deckle, מדי פעם שחור-לבן/דואוטון */
export function autoTreatment(index: number): PhotoItem["treatment"] {
  if (index % 4 === 1) return "bw";
  if (index % 4 === 3) return "duotone";
  return "deckle";
}

function poolPhoto(dataUrl: string, index: number): PhotoItem {
  return {
    id: makeId("photo"),
    dataUrl,
    caption: "",
    treatment: autoTreatment(index),
    rotation: Math.round((((index * 37) % 9) - 4) * 10) / 10,
  };
}

/** מפזר תמונות שהועלו מראש בין העמודים הראשונים שמאפשרים תמונה */
function distributePhotos(pages: QPageState[], pool: string[]): QPageState[] {
  if (!pool.length) return pages;
  const photoPageIdx = QUESTIONNAIRE.map((p, i) => (p.allowPhoto ? i : -1)).filter((i) => i >= 0);
  if (!photoPageIdx.length) return pages;

  const next = pages.map((page) => ({ ...page, photos: [...page.photos] }));
  pool.forEach((dataUrl, i) => {
    const target = photoPageIdx[i % photoPageIdx.length];
    next[target].photos.push(poolPhoto(dataUrl, i));
  });
  return next;
}

export function initialState(nameA: string, nameB: string, photoPool: string[] = []): SessionState {
  return {
    brides: { a: { name: nameA }, b: { name: nameB } },
    currentPage: 0,
    pages: distributePhotos(
      QUESTIONNAIRE.map((p) => emptyPage(p.key)),
      photoPool
    ),
  };
}

export type SessionAction =
  | { type: "SET_PAGE"; page: number }
  | { type: "SET_ANSWER"; page: number; fieldId: string; patch: Partial<Answer> }
  | { type: "ADD_PHOTO"; page: number; photo: PhotoItem }
  | { type: "UPDATE_PHOTO"; page: number; photoId: string; patch: Partial<PhotoItem> }
  | { type: "REMOVE_PHOTO"; page: number; photoId: string };

function mapPage(
  state: SessionState,
  pageIndex: number,
  update: (page: QPageState) => QPageState
): SessionState {
  return {
    ...state,
    pages: state.pages.map((page, i) => (i === pageIndex ? update(page) : page)),
  };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case "SET_PAGE":
      return { ...state, currentPage: action.page };

    case "SET_ANSWER":
      return mapPage(state, action.page, (page) => ({
        ...page,
        answers: {
          ...page.answers,
          [action.fieldId]: { ...page.answers[action.fieldId], ...action.patch },
        },
      }));

    case "ADD_PHOTO":
      return mapPage(state, action.page, (page) => ({ ...page, photos: [...page.photos, action.photo] }));

    case "UPDATE_PHOTO":
      return mapPage(state, action.page, (page) => ({
        ...page,
        photos: page.photos.map((photo) =>
          photo.id === action.photoId ? { ...photo, ...action.patch } : photo
        ),
      }));

    case "REMOVE_PHOTO":
      return mapPage(state, action.page, (page) => ({
        ...page,
        photos: page.photos.filter((photo) => photo.id !== action.photoId),
      }));

    default:
      return state;
  }
}

/** עוזר בטוח לשליפת תשובה */
export function getAnswer(page: QPageState | undefined, fieldId: string): Answer {
  return page?.answers[fieldId] ?? {};
}
