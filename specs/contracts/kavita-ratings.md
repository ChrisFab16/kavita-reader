# Contract: Kavita Ratings (Starred)

**Status**: Draft — verify on live server (T001)

Kavita **"starred"** series use **user star ratings** (typically 0–5), not a separate favorites table.

## Endpoints (expected)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/rating?seriesId={id}` | Ratings for series (includes user rating) |
| POST | `/api/Review/series` | Update user review/rating (`UpdateUserReviewDto` / `UserReviewDto`) |
| DELETE | `/api/Review/series` | Clear user review |

## Series list enrichment

`SeriesDto` may include `userRating` when server enriches list responses — use for grid badges.

## Starred shelf filter

Option A: `POST /api/Series/all-v2` or v2 filter with `FilterField.UserRating` (comparison + threshold).

Option B: Dedicated highly-rated query if exposed — confirm in spike.

Default threshold: user rating ≥ 1 star unless Settings adds configuration later.

## UI copy

Use **Rating** or **Stars** in app strings — avoid "Favorite" unless Kavita adds distinct favorite API.

## Client usage

- Series detail: star picker → `Review/series`
- Home → Starred shelf (filtered grid)
