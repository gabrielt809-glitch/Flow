import assert from "node:assert/strict";
import { diffHours, percent } from "../assets/js/utils.js";

export async function run() {
  assert.equal(diffHours("23:00", "07:00"), 8);
  assert.equal(percent(50, 100), 50);
}
