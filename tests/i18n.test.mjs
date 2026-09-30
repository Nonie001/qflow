import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, localizeName, parseLocale, STATUS_LABELS, translate } from "../lib/i18n.ts";

test("Thai remains the default and Malay translations are selected explicitly", () => {
  assert.equal(parseLocale(undefined), "th");
  assert.equal(parseLocale("unexpected"), "th");
  assert.equal(parseLocale("ms"), "ms");
  assert.equal(translate("ms", "จองคิว", "Tempah giliran"), "Tempah giliran");
  assert.equal(STATUS_LABELS.ms.called, "Telah dipanggil");
});

test("dates and default database labels follow the selected language", () => {
  assert.match(formatDate("2026-09-30", "th"), /กันยายน/);
  assert.match(formatDate("2026-09-30", "ms"), /September/);
  assert.equal(localizeName("บริการทั่วไป", "ms"), "Perkhidmatan am");
  assert.equal(localizeName("ช่อง 2", "ms"), "Kaunter 2");
  assert.equal(localizeName("บริการเฉพาะ", "ms"), "บริการเฉพาะ");
});
