import type { AvatarConfig } from "@/lib/avatar";

export type Outfit = AvatarConfig["outfit"];
export type Headwear = AvatarConfig["headwear"];
export type AvatarPart = "full" | "base" | "outfit" | "headwear" | "face";

interface AvatarProps {
  skin: string;
  outfit: Outfit;
  headwear: Headwear;
  gender?: AvatarConfig["gender"];
  part?: AvatarPart;
  label?: string;
  className?: string;
  fullFrame?: boolean;
}

const ink = "#28283d";
const gold = "#e7b54e";
const bronze = "#c78a49";

function BackLayer({ outfit }: { outfit: Outfit }) {
  if (outfit === "tunic") return null;
  return (
    <g data-layer="cape-back" fill={outfit === "cape" ? "#386fa1" : "#934647"}>
      <path d="M120 228 Q99 244 92 325 Q121 343 160 330 Q197 344 227 325 L202 236 Z" />
      <path d="M112 272 107 322 M211 322 202 271" fill="none" opacity=".3" />
    </g>
  );
}

function BaseLayer({ skin, baseOnly }: { skin: string; baseOnly: boolean }) {
  return (
    <g data-layer="body" fill={skin}>
      <path d="M131 305 129 352 Q114 355 116 367 Q133 378 149 369 L152 312 Z" />
      <path d="M169 311 171 369 Q188 378 205 367 Q207 355 192 352 L190 305 Z" />
      <path d="M123 235 Q111 231 104 247 L88 289 Q83 305 93 312 Q103 316 108 305 L114 292 132 255 Z" />
      <path d="M197 235 Q209 231 216 247 L232 289 Q237 305 227 312 Q217 316 212 305 L206 292 188 255 Z" />
      <path d="M144 209 V229 Q116 231 120 264 L119 312 Q160 328 201 312 L200 264 Q204 231 176 229 V209 Z" />
      {baseOnly && (
        <g fill="#ece6d9">
          <path d="M140 225 Q160 240 180 225 L201 241 208 263 192 269 192 292 H128 V269 L112 263 119 241 Z" />
          <path d="M127 291 H193 V323 H166 L160 311 154 323 H127 Z" />
        </g>
      )}
    </g>
  );
}

function Sandals() {
  return (
    <g data-layer="sandals" fill="#895333" strokeWidth="3.5">
      <path d="M117 363 Q133 369 149 362 V371 Q133 379 117 371 Z" />
      <path d="M171 362 Q188 369 204 363 V371 Q188 379 171 371 Z" />
      <path
        d="M128 337 146 350 M146 337 127 351 M126 355 146 364 M174 337 192 350 M192 337 175 351 M176 364 194 355"
        fill="none"
        stroke="#895333"
        strokeWidth="6"
      />
    </g>
  );
}

function OutfitLayer({ outfit }: { outfit: Outfit }) {
  const blue = outfit === "cape";
  return (
    <g data-layer="outfit" data-outfit={outfit}>
      {outfit === "armor" ? (
        <g>
          <path fill="#604339" d="M125 286 H195 L207 322 Q160 340 113 322 Z" />
          {[0, 1, 2, 3, 4].map((i) => (
            <path
              key={i}
              fill={bronze}
              d={`M${124 + i * 15} 290 h12 l4 34 -15 3 Z`}
              strokeWidth="3"
            />
          ))}
          <path
            fill={bronze}
            d="M123 232 142 225 Q160 241 178 225 L197 232 192 285 Q160 301 128 285 Z"
          />
          <path
            fill="#e0a75d"
            d="M122 231 109 237 105 253 126 259 139 235 Z M198 231 211 237 215 253 194 259 181 235 Z"
          />
          <path
            d="M130 257 Q144 244 157 258 M163 258 Q176 244 190 257 M136 273 Q160 285 184 273"
            fill="none"
            stroke="#915b37"
            strokeWidth="3"
          />
          <path
            fill={gold}
            d="m160 241 5 8 9 2 -6 7 1 10 -9 -4 -9 4 1 -10 -6 -7 9 -2 Z"
            strokeWidth="2.5"
          />
        </g>
      ) : (
        <g>
          <path
            fill="#fff6de"
            d="M139 225 Q160 239 181 225 L201 237 212 257 193 268 190 280 205 322 Q160 344 115 322 L130 280 127 268 108 257 119 237 Z"
          />
          <path
            d="m115 254 14 8 M191 262 l14 -8 M121 318 Q160 334 199 318"
            fill="none"
            stroke={blue ? "#386fa1" : gold}
            strokeWidth="6"
          />
          <path
            d="M139 239 160 268 184 244 M140 296 135 316 M180 296 186 317"
            fill="none"
            stroke="#d6c9b0"
            strokeWidth="3"
          />
          {blue && (
            <path fill="#477fb0" d="M128 228 Q154 245 195 230 L200 248 Q157 265 125 241 Z" />
          )}
          <circle cx="190" cy="237" r="8" fill={gold} strokeWidth="3" />
        </g>
      )}
      <path
        fill={blue ? "#315c83" : "#a86d37"}
        d="M128 279 Q160 288 192 279 V291 Q160 300 128 291 Z"
        strokeWidth="3"
      />
      {!blue && <path fill={gold} d="M167 292 177 293 182 316 170 316 Z" strokeWidth="3" />}
      <circle cx="160" cy="288" r="11" fill={gold} strokeWidth="3" />
      <path d="m160 282 2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2Z" fill="#a77535" stroke="none" />
      <g fill={gold} strokeWidth="3">
        <path d="m95 277 16 6 -4 12 -16 -6Z" />
        <path d="m209 283 16 -6 4 12 -16 6Z" />
      </g>
      <Sandals />
    </g>
  );
}

function FaceLayer({ skin, gender }: { skin: string; gender: AvatarConfig["gender"] }) {
  return (
    <g data-layer="face">
      <g fill={skin}>
        <ellipse cx="65" cy="151" rx="15" ry="20" />
        <ellipse cx="255" cy="151" rx="15" ry="20" />
        <rect x="65" y="61" width="190" height="158" rx="62" />
      </g>
      <g fill={ink} stroke="none">
        <ellipse cx="117" cy="151" rx="12" ry="17" />
        <ellipse cx="203" cy="151" rx="12" ry="17" />
      </g>
      <g fill="#fff" stroke="none">
        <circle cx="113" cy="145" r="3.5" />
        <circle cx="199" cy="145" r="3.5" />
      </g>
      <g fill="#d97870" opacity=".3" stroke="none">
        <ellipse cx="97" cy="174" rx="12" ry="6" />
        <ellipse cx="223" cy="174" rx="12" ry="6" />
      </g>
      <path d="M147 184 Q160 195 173 184" fill="none" strokeWidth="4" />
      {gender === "female" && (
        <g fill="none" strokeWidth="3">
          <path d="M106 140 l-6 -5 M113 140 l-2 -6 M97 177 l8 -3 M213 140 l6 -5 M207 140 l2 -6 M223 177 l-8 -3" />
          <path d="M146 184 Q160 201 174 184" stroke="#a85561" />
        </g>
      )}
    </g>
  );
}

function HairLayer({ gender }: { gender: AvatarConfig["gender"] }) {
  if (gender === "female") {
    return (
      <g data-layer="hair" data-gender="female" fill="#443044">
        <path d="M66 150 Q49 113 65 77 Q71 35 122 35 Q157 22 185 35 Q249 37 257 89 Q273 126 254 153 L248 114 Q195 125 157 69 Q125 111 74 118Z" />
        <path d="M66 132 Q46 152 51 190 Q45 214 62 230 Q86 235 99 211 L84 193 Q68 190 76 167Z M254 132 Q274 152 269 190 Q275 214 258 230 Q234 235 221 211 L236 193 Q252 190 244 167Z" />
        <path
          d="M83 80 Q102 51 131 55 M176 48 Q220 49 236 87 M62 172 Q59 200 73 214 M258 172 Q261 200 247 214"
          fill="none"
          stroke="#67455e"
          strokeWidth="5"
        />
        <g fill={gold} strokeWidth="3">
          <path d="m58 199 23 4 -2 9 -24 -4Z M239 203 l23 -4 3 9 -24 4Z" />
        </g>
      </g>
    );
  }
  return (
    <g data-layer="hair" fill="#343042">
      <path d="M68 144 Q50 130 60 107 Q47 88 66 73 Q65 52 90 52 Q99 32 122 43 Q144 20 165 38 Q192 26 205 45 Q230 38 239 61 Q266 64 260 87 Q278 104 258 133 L250 148 238 119 Q218 120 211 96 Q194 118 172 105 Q162 131 128 119 Q150 103 145 90 Q112 120 79 113 L75 145 Z" />
      <path
        d="M82 83 Q98 61 119 70 M169 58 Q190 47 204 66 M170 82 Q185 81 192 70"
        fill="none"
        stroke="#51475c"
        strokeWidth="6"
      />
    </g>
  );
}

function HeadwearLayer({ headwear }: { headwear: Headwear }) {
  return (
    <g data-layer="headwear" data-headwear={headwear}>
      {headwear === "laurel" && (
        <g fill={gold} strokeWidth="3">
          <path
            d="M88 118 Q64 86 103 48 M232 118 Q256 86 217 48"
            fill="none"
            stroke="#8a713f"
            strokeWidth="4"
          />
          {[0, 1].map((side) => (
            <g key={side} transform={side ? "translate(320 0) scale(-1 1)" : undefined}>
              <path d="M85 109 Q61 109 60 87 Q81 88 85 109Z M81 91 Q60 82 66 64 Q86 72 81 91Z M88 73 Q73 57 84 41 Q101 55 88 73Z M97 60 Q95 39 114 33 Q120 54 97 60Z M86 109 Q105 97 98 83 Q81 90 86 109Z" />
            </g>
          ))}
        </g>
      )}
      {headwear === "helmet" && (
        <g>
          <path fill="#9c484b" d="M141 51 141 20 Q160 6 179 20 L179 51Z" />
          <path d="M153 20 V45 M166 18 V44" fill="none" stroke="#c46759" strokeWidth="4" />
          <path
            fill={bronze}
            d="M62 122 Q52 44 160 42 Q268 44 258 122 L252 173 228 198 220 125 Q189 111 173 130 L169 161 H151 L147 130 Q126 111 100 125 L92 198 68 173Z"
          />
          <path
            d="M65 108 Q110 90 149 110 L160 120 171 110 Q210 90 255 108 M160 48 V107"
            fill="none"
            stroke={gold}
            strokeWidth="7"
          />
          <path
            d="M77 138 80 169 88 179 M243 138 240 169 232 179"
            fill="none"
            stroke="#e7b266"
            strokeWidth="4"
          />
        </g>
      )}
      {headwear === "hat" && (
        <g data-accessory="crown">
          <path
            fill={gold}
            d="M65 54 L92 73 L112 35 L135 65 L160 16 L185 65 L208 35 L228 73 L255 54 L244 112 Q160 136 76 112Z"
          />
          <path
            fill="#f8d878"
            d="M74 91 Q160 111 246 91 L244 112 Q160 136 76 112Z"
            strokeWidth="3"
          />
          <path fill="#2563eb" d="M160 69 L171 85 L160 101 L149 85Z" strokeWidth="3" />
          <circle cx="110" cy="98" r="5" fill="#ef4444" strokeWidth="2" />
          <circle cx="210" cy="98" r="5" fill="#ef4444" strokeWidth="2" />
          <g fill="#fff0ad" strokeWidth="3">
            <circle cx="65" cy="52" r="5" />
            <circle cx="112" cy="33" r="5" />
            <circle cx="160" cy="15" r="6" />
            <circle cx="208" cy="33" r="5" />
            <circle cx="255" cy="52" r="5" />
          </g>
        </g>
      )}
    </g>
  );
}

/** Every piece uses the same 320 × 400 coordinates and explicit drawing order. */
export function AvatarCharacter({
  skin,
  outfit,
  headwear,
  gender = "male",
  part = "full",
  label,
  className,
  fullFrame = false,
}: AvatarProps) {
  const body = part === "full" || part === "base";
  const face = body || part === "face";
  const clothes = part === "full" || part === "outfit";
  return (
    <svg
      className={className}
      viewBox={
        fullFrame
          ? "0 0 320 400"
          : part === "face"
            ? "25 0 270 270"
            : part === "outfit"
              ? "78 217 164 169"
              : part === "headwear"
                ? "35 0 250 222"
                : "0 0 320 400"
      }
      xmlns="http://www.w3.org/2000/svg"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      fill="none"
      stroke={ink}
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {label && <title>{label}</title>}
      {clothes && <BackLayer outfit={outfit} />}
      {gender === "female" && face && (
        <path
          data-layer="hair-back"
          fill="#443044"
          d="M76 92 Q48 125 55 208 L64 241 Q89 254 107 232 L109 174 H211 L213 232 Q231 254 256 241 L265 208 Q272 125 244 92Z"
        />
      )}
      {body && <BaseLayer skin={skin} baseOnly={part === "base"} />}
      {clothes && <OutfitLayer outfit={outfit} />}
      {face && (
        <>
          <FaceLayer skin={skin} gender={gender} />
          <HairLayer gender={gender} />
        </>
      )}
      {(part === "full" || part === "headwear" || part === "face") && (
        <HeadwearLayer headwear={headwear} />
      )}
    </svg>
  );
}
