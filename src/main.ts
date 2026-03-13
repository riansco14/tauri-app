//import { invoke } from "@tauri-apps/api/core";
import IMask from "imask";

let container: HTMLElement | null;
let addBtn: HTMLElement | null;
let enviarBtn: HTMLElement | null;

let firstLoading = true;
const cpfMasks: any[] = [];

function criarInputCPF() {
  const input = document.createElement("input");

  input.placeholder = "000.000.000-00";
  input.classList.add("cpf-input");

  container?.appendChild(input);

  const mask = IMask(input, {
    mask: "000.000.000-00",
  });

  cpfMasks.push(mask);
}
/*
async function enviarRequest() {
  const resposta = await fetch("https://jsonplaceholder.typicode.com/posts/1");

  const data = await resposta.json();

  console.log(JSON.stringify(data, null, 2));

  return data;
}

async function greet() {
  const teste = await enviarRequest();
  console.log("objeto:", teste);
}
*/

window.addEventListener("DOMContentLoaded", () => {
  container = document.getElementById("cpfs-container");
  addBtn = document.getElementById("addCpf");
  enviarBtn = document.getElementById("enviar");

  if (firstLoading) {
    criarInputCPF();
    firstLoading = false;
  }

  document.querySelector("#greet-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    //greet();
  });

  addBtn?.addEventListener("click", criarInputCPF);

  enviarBtn?.addEventListener("click", () => {
    const cpfs = cpfMasks.map((mask) => mask.unmaskedValue);

    console.log("CPFs:", cpfs);
  });
});
