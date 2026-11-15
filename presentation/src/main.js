import Reveal from "reveal.js";
import Notes from "reveal.js/plugin/notes";
import "reveal.js/reveal.css";
import "computer-modern/cmu-serif.css";
import "@fontsource/source-serif-4/400.css";
import "@fontsource/source-serif-4/600.css";
import "./style.css";
import { opening, closing } from "./slides/story.js";
import { science } from "./slides/science.js";
import { demo } from "./slides/demo.js";

// Static slide content: exactly seven slides, no step-by-step reveals.
document.getElementById("presentation-slides").innerHTML = [...opening, ...science, ...closing, ...demo].join("\n");
const deck = new Reveal({
  hash: true, width: 1440, height: 810, center: false, margin: 0.04,
  transition: "fade", backgroundTransition: "fade", transitionSpeed: "fast",
  fragments: false, pdfSeparateFragments: false,
  controls: true, progress: true, slideNumber: "c/t", plugins: [Notes],
});
void deck.initialize();
