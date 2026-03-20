use reqwest::header::{HeaderMap, HeaderValue, CONTENT_TYPE};
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
struct ChangeStatusResponse {
    cpf_string: Option<String>,
    last_id: Option<String>,
    status: Option<String>,
}

#[derive(Deserialize, Debug)]
struct HistoryItem {
    id: String,
}

#[derive(Deserialize, Debug)]
struct PatchResponse {
    status: Option<String>,
}

#[tauri::command]
async fn change_status(cpf_string: String) -> Result<ChangeStatusResponse, String> {
    let mut headers = HeaderMap::new();
    headers.insert("ApiKey", HeaderValue::from_static("l7b7ab566270c14f84a01b42952aaa3c11"));
    headers.insert("apikey-gestao", HeaderValue::from_static("ec82ef97-e3f0-47af-9993-fc75b1275773"));
    headers.insert(
        "Cookie",
        HeaderValue::from_static("citrix_ns_id=AAA7TUbdaDt68I4BAAAAADu5KVB1jRyc_wxkO-JrgssCIm5t43iFBJMulxS-24t-Ow==HUvdaA==04IzcmPU-NaAC7RhVaO1y30StpU=; citrix_ns_id_.des.caixa_%2F_wat=AAAAAAWBIVkNUe_YXMj4eLiqc6uJVtVbo_1orl-g49Leio1-Sk_JcZ1KLSy_nVcGuf5WWqHPGNiuU3NSIDJyd9DMOfhI&"),
    );

    let client = reqwest::Client::builder()
        .danger_accept_invalid_certs(true)
        .build()
        .map_err(|e| format!("erro criando client http: {e}"))?;

    let history_url = format!(
        "https://api.des.caixa:8443/siipc-xid-gestao/gestao/historico/{}",
        cpf_string
    );

    let history_response = client
        .get(&history_url)
        .headers(headers.clone())
        .send()
        .await
        .map_err(|e| format!("erro no GET historico: {e}"))?;

    if !history_response.status().is_success() {
        return Err(format!(
            "GET historico retornou status {}",
            history_response.status()
        ));
    }

    let history_items: Vec<HistoryItem> = history_response
        .json()
        .await
        .map_err(|e| format!("erro lendo json do historico: {e}"))?;

    let last_id = history_items.first().map(|x| x.id.clone());

    let Some(last_id_value) = last_id else {
        return Ok(ChangeStatusResponse {
            cpf_string: None,
            last_id: None,
            status: None,
        });
    };

    let patch_url = format!(
        "https://api.des.caixa:8443/siipc-xid-gestao/gestao/atualizar/{}",
        last_id_value
    );

    let mut patch_headers = headers.clone();
    patch_headers.insert(CONTENT_TYPE, HeaderValue::from_static("application/json"));

    let patch_body = serde_json::json!({
        "status": 12
    });

    let patch_response = client
        .patch(&patch_url)
        .headers(patch_headers)
        .json(&patch_body)
        .send()
        .await
        .map_err(|e| format!("erro no PATCH atualizar: {e}"))?;

    if !patch_response.status().is_success() {
        return Err(format!(
            "PATCH atualizar retornou status {}",
            patch_response.status()
        ));
    }

    let patch_json: PatchResponse = patch_response
        .json()
        .await
        .map_err(|e| format!("erro lendo json do PATCH: {e}"))?;

    Ok(ChangeStatusResponse {
        cpf_string: Some(cpf_string),
        last_id: Some(last_id_value),
        status: patch_json.status,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![change_status])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}