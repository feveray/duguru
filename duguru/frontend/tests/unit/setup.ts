import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

/* Limpa o DOM depois de cada teste */
afterEach(() => {
  cleanup();
});
