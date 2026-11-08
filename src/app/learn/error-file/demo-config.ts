export const BASE_PATH = "/learn/error-file"

/** 障害の終了時刻（エポックミリ秒）を入れる cookie。閲覧者ごとに独立させるため cookie を使う */
export const OUTAGE_COOKIE = "nsc-error-demo-outage"

/** 一時的な障害が続く時間（ms） */
export const OUTAGE_MS = 5000
