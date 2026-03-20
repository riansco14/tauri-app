import { invoke } from "@tauri-apps/api/core";
import IMask from "imask";

interface RequestChangeStatus {
  cpf_string?: string;
  last_id?: string;
  status?: string;
}

type ResultadoCpf =
  | { ok: true; cpf: string; data: RequestChangeStatus }
  | { ok: false; cpf: string; error: string };

let container: HTMLElement | null;
let addBtn: HTMLButtonElement | null;
let resultsContainer: HTMLElement | null;

const cpfMasks: IMask.InputMask<any>[] = [];

function formatarCpf(cpf: string): string {
  if (cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function criarCardResultado(
  cpf: string,
  resultado?: RequestChangeStatus,
  erro?: string,
): HTMLDivElement {
  const card = document.createElement("div");
  card.className = `card ${erro ? "error" : "success"}`;

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = `CPF: ${formatarCpf(cpf)}`;

  const body = document.createElement("div");

  if (erro) {
    body.innerHTML = `<div><strong>Erro:</strong> ${erro}</div>`;
  } else {
    body.innerHTML = `
      <div><strong>Last ID:</strong> ${resultado?.last_id ?? "-"}</div>
      <div><strong>Status:</strong> ${resultado?.status ?? "-"}</div>
    `;
  }

  card.appendChild(title);
  card.appendChild(body);

  return card;
}

function criarInputCPF(): void {
  const row = document.createElement("div");
  row.className = "cpf-row";

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "000.000.000-00";
  input.className = "cpf-input";

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.textContent = "Remover";
  removeBtn.className = "remove-btn";

  row.appendChild(input);
  row.appendChild(removeBtn);
  container?.appendChild(row);

  const mask = IMask(input, {
    mask: "000.000.000-00",
  });

  cpfMasks.push(mask);

  removeBtn.addEventListener("click", () => {
    const index = cpfMasks.indexOf(mask);
    if (index >= 0) {
      cpfMasks.splice(index, 1);
    }

    mask.destroy();
    row.remove();
  });
}

function limparResultados(): void {
  if (resultsContainer) {
    resultsContainer.innerHTML = "";
  }
}

function mostrarMensagem(texto: string, className = "loading"): void {
  if (!resultsContainer) return;

  const div = document.createElement("div");
  div.className = className;
  div.textContent = texto;
  resultsContainer.appendChild(div);
}

async function processarCpfs(cpfs: string[]): Promise<ResultadoCpf[]> {
  return Promise.all(
    cpfs.map(async (cpf) => {
      try {
        const data = await invoke<RequestChangeStatus>("change_status", {
          cpfString: cpf,
        });

        return {
          ok: true,
          cpf,
          data,
        };
      } catch (error) {
        return {
          ok: false,
          cpf,
          error: String(error),
        };
      }
    }),
  );
}

window.addEventListener("DOMContentLoaded", () => {
  container = document.getElementById("cpfs-container");
  addBtn = document.getElementById("addCpf") as HTMLButtonElement | null;
  resultsContainer = document.getElementById("results-container");

  criarInputCPF();

  addBtn?.addEventListener("click", () => {
    criarInputCPF();
  });

  document
    .getElementById("greet-form")
    ?.addEventListener("submit", async (e) => {
      e.preventDefault();

      limparResultados();

      const cpfs = cpfMasks
        .map((mask) => mask.unmaskedValue.trim())
        .filter((cpf) => cpf.length === 11);

      if (cpfs.length === 0) {
        mostrarMensagem("Adicione pelo menos um CPF válido.");
        return;
      }

      mostrarMensagem("Processando CPFs...");

      const resultados = await processarCpfs(cpfs);

      limparResultados();

      resultados.forEach((resultado) => {
        if (resultado.ok) {
          const card = criarCardResultado(resultado.cpf, resultado.data);
          resultsContainer?.appendChild(card);
        } else {
          const card = criarCardResultado(
            resultado.cpf,
            undefined,
            resultado.error,
          );
          resultsContainer?.appendChild(card);
        }
      });
    });
});
