"use client";

import { type Dispatch } from "react";
import { autoTreatment, makeId, type SessionAction } from "@/lib/state";
import type { PhotoItem } from "@/lib/types";

type PhotoCollageProps = {
  pageIndex: number;
  photos: PhotoItem[];
  prompt: string | null;
  dispatch: Dispatch<SessionAction>;
};

/**
 * תצוגת התמונות בעמוד. הסגנון (מסגרת קרועה / שחור-לבן / דואוטון / גזירה) נקבע
 * אוטומטית — הכלות לא מתעסקות בעיצוב. השאלה היחידה היא תוכן: מה התמונה מספרת.
 */
export default function PhotoCollage({ pageIndex, photos, prompt, dispatch }: PhotoCollageProps) {
  function addFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const photo: PhotoItem = {
        id: makeId("photo"),
        dataUrl: String(reader.result),
        caption: "",
        treatment: autoTreatment(photos.length),
        rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
      };
      dispatch({ type: "ADD_PHOTO", page: pageIndex, photo });
    };
    reader.readAsDataURL(file);
  }

  const canAdd = photos.length < 4;

  return (
    <div className="space-y-4">
      {prompt && <p className="font-script text-lg leading-relaxed text-brand-gold">{prompt}</p>}

      <div className="flex flex-wrap items-start gap-6">
        {photos.map((photo) => (
          <div key={photo.id} className="w-40 space-y-2">
            <div className="relative" style={{ transform: `rotate(${photo.rotation}deg)` }}>
              {photo.treatment !== "cutout" && <span className="washi-tape" />}
              <div className={`photo-frame treat-${photo.treatment}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.editedUrl ?? photo.dataUrl}
                  alt={photo.caption || "תמונה"}
                  className="block h-32 w-full object-cover"
                />
              </div>
            </div>

            {/* השאלה היחידה לכלות — תוכן, לא עיצוב */}
            <input
              type="text"
              value={photo.caption}
              onChange={(e) =>
                dispatch({
                  type: "UPDATE_PHOTO",
                  page: pageIndex,
                  photoId: photo.id,
                  patch: { caption: e.target.value },
                })
              }
              placeholder="מה התמונה מספרת"
              className="w-full bg-transparent text-center font-script text-base text-brand-ink/80 outline-none placeholder:text-brand-sand"
            />

            <div className="text-center">
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_PHOTO", page: pageIndex, photoId: photo.id })}
                className="text-xs text-brand-sand transition hover:text-brand-roseDark"
              >
                הסרה
              </button>
            </div>
          </div>
        ))}

        {canAdd && (
          <label className="flex h-32 w-40 cursor-pointer items-center justify-center rounded-sm border border-dashed border-brand-sand/60 font-script text-base text-brand-sand transition hover:border-brand-rose hover:text-brand-roseDark">
            + תמונה
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) addFile(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
      </div>
    </div>
  );
}
