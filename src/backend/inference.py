# src/backend/inference.py
import json
import sys
from llama_cpp import Llama

def run_inference(model_id, message, config):
    try:
        model_path = f"{config['model_dir']}/{model_id}.gguf"
        llm = Llama(
            model_path=model_path,
            n_gpu_layers=config.get('n_gpu_layers', 0),
            n_threads=config.get('n_threads', 4),
            n_ctx=config.get('n_ctx', 4096),  # Match model training context
            n_batch=config.get('n_batch', 512),
        )
        params = {
            "max_tokens": 512,
            "temperature": 0.7,
            "top_p": 0.9,
        }
        response = llm(message, **params)
        return {"response": response["choices"][0]["text"].strip()}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        input_data = json.loads(sys.argv[1])
        model_id = input_data["modelId"]
        message = input_data["message"]
        config = input_data["config"]
        result = run_inference(model_id, message, config)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))