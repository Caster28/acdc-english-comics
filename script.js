const units = {
  greetings: {
    number: "01",
    title: "Greetings and Introductions",
    description: "Meet a new friend and practise a simple English conversation.",
    caption: "Two students meet for the first time.",
    names: ["Alex", "Maya"],
    dialogues: [
      { speaker: "Alex", side: "a", text: "Hi! What's your name?" },
      { speaker: "Maya", side: "b", text: "Hello! I'm Maya. What's your name?" },
      { speaker: "Alex", side: "a", text: "I'm Alex. Nice to meet you." },
      { speaker: "Maya", side: "b", text: "Nice to meet you, too!" }
    ]
  },
  school: {
    number: "02",
    title: "At School",
    description: "Practise a short conversation with a classmate at school.",
    caption: "Two classmates talk before the lesson begins.",
    names: ["Alex", "Maya"],
    dialogues: [
      { speaker: "Alex", side: "a", text: "Good morning, Maya." },
      { speaker: "Maya", side: "b", text: "Good morning, Alex. How are you?" },
      { speaker: "Alex", side: "a", text: "I'm fine, thank you. And you?" },
      { speaker: "Maya", side: "b", text: "I'm great. Are you ready for English class?" },
      { speaker: "Alex", side: "a", text: "Yes, I am. Let's go!" }
    ]
  },
  hobbies: {
    number: "03",
    title: "Talking about Hobbies",
    description: "Ask and answer questions about activities you enjoy.",
    caption: "Friends discover what they like to do after school.",
    names: ["Alex", "Maya"],
    dialogues: [
      { speaker: "Maya", side: "b", text: "What do you like to do, Alex?" },
      { speaker: "Alex", side: "a", text: "I like playing football. What about you?" },
      { speaker: "Maya", side: "b", text: "I enjoy drawing and reading comics." },
      { speaker: "Alex", side: "a", text: "That sounds fun!" }
    ]
  }
};

const $ = (id) => document.getElementById(id);
let currentUnit = "greetings";
let isPlayingAll = false;
let speechToken = 0;

function getUnitFromURL() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("unit");
  return units[requested] ? requested : "greetings";
}

function renderUnit(key, updateURL = false) {
  currentUnit = units[key] ? key : "greetings";
  const unit = units[currentUnit];
  $("unitBadge").textContent = `UNIT ${unit.number}`;
  $("unitTitle").textContent = unit.title;
  $("unitDescription").textContent = unit.description;
  $("sceneNumber").textContent = `SCENE ${unit.number}`;
  $("sceneCaption").textContent = unit.caption;
  $("nameA").textContent = unit.names[0];
  $("nameB").textContent = unit.names[1];
  $("unitSelect").value = currentUnit;
  $("bubbleA").textContent = unit.dialogues.find(d => d.side === "a")?.text || "Hello!";
  $("bubbleB").textContent = unit.dialogues.find(d => d.side === "b")?.text || "Hi!";
  $("dialogueList").innerHTML = "";

  unit.dialogues.forEach((line, index) => {
    const row = document.createElement("article");
    row.className = "dialogue-row";
    const icon = document.createElement("div");
    icon.className = `speaker-icon ${line.side}`;
    icon.textContent = line.speaker.slice(0, 1);
    const content = document.createElement("div");
    content.className = "dialogue-text";
    const speaker = document.createElement("strong");
    speaker.textContent = line.speaker;
    const text = document.createElement("p");
    text.textContent = line.text;
    content.append(speaker, text);
    const play = document.createElement("button");
    play.className = "play-line";
    play.type = "button";
    play.setAttribute("aria-label", `Play line ${index + 1} by ${line.speaker}`);
    play.textContent = "▶";
    play.addEventListener("click", () => speakLine(line, index));
    row.append(icon, content, play);
    $("dialogueList").append(row);
  });

  if (updateURL) {
    const url = new URL(window.location.href);
    url.searchParams.set("unit", currentUnit);
    history.pushState({ unit: currentUnit }, "", url);
  }
  stopSpeaking();
}

function setSpeaking(side, text) {
  $("characterA").classList.toggle("speaking", side === "a");
  $("characterB").classList.toggle("speaking", side === "b");
  if (side === "a") $("bubbleA").textContent = text;
  else $("bubbleB").textContent = text;
}

function stopSpeaking() {
  speechToken++;
  isPlayingAll = false;
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  $("characterA").classList.remove("speaking");
  $("characterB").classList.remove("speaking");
}

function speakLine(line, index = 0) {
  if (!("speechSynthesis" in window)) {
    alert("Your browser does not support text-to-speech. Please try a recent version of Chrome.");
    return Promise.resolve();
  }
  window.speechSynthesis.cancel();
  const token = ++speechToken;
  setSpeaking(line.side, line.text);
  const utterance = new SpeechSynthesisUtterance(line.text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = line.side === "a" ? 1.0 : 1.12;
  return new Promise(resolve => {
    utterance.onend = () => {
      if (token === speechToken) {
        $("characterA").classList.remove("speaking");
        $("characterB").classList.remove("speaking");
      }
      resolve();
    };
    utterance.onerror = () => {
      $("characterA").classList.remove("speaking");
      $("characterB").classList.remove("speaking");
      resolve();
    };
    window.speechSynthesis.speak(utterance);
  });
}

async function playAll() {
  if (isPlayingAll) { stopSpeaking(); $("playAllBtn").textContent = "▶ Play all"; return; }
  isPlayingAll = true;
  $("playAllBtn").textContent = "■ Stop";
  const token = speechToken;
  const lines = units[currentUnit].dialogues;
  for (let i = 0; i < lines.length; i++) {
    if (!isPlayingAll || token !== speechToken) break;
    await speakLine(lines[i], i);
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  isPlayingAll = false;
  $("playAllBtn").textContent = "▶ Play all";
  $("characterA").classList.remove("speaking");
  $("characterB").classList.remove("speaking");
}

$("unitSelect").addEventListener("change", event => renderUnit(event.target.value, true));
$("playAllBtn").addEventListener("click", playAll);
$("practiceBtn").addEventListener("click", () => {
  $("practiceStatus").textContent = "Your turn! Read each line aloud, then practise the conversation with a partner.";
  $("dialogueList").scrollIntoView({ behavior: "smooth", block: "start" });
});
window.addEventListener("popstate", () => renderUnit(getUnitFromURL()));
renderUnit(getUnitFromURL());
