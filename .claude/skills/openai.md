# OpenAI SDK

## Key Patterns
- Use `openai.OpenAI()` client (sync) or `openai.AsyncOpenAI()` for async FastAPI endpoints
- Set API key via `OPENAI_API_KEY` env var or pass explicitly
- Use structured outputs with `response_format` for reliable JSON parsing
- Prefer `gpt-4o` for generation/reflection nodes, `gpt-4o-mini` for cost-sensitive calls

## Basic Usage
```python
from openai import AsyncOpenAI

client = AsyncOpenAI()

response = await client.chat.completions.create(
    model="gpt-4o",
    messages=[
        {"role": "system", "content": "You are a creative ad copywriter."},
        {"role": "user", "content": prompt}
    ],
    temperature=0.8,
)
text = response.choices[0].message.content
```

## Structured Output (JSON mode)
```python
response = await client.chat.completions.create(
    model="gpt-4o",
    messages=messages,
    response_format={"type": "json_object"},
)
data = json.loads(response.choices[0].message.content)
```

## Common Commands
```bash
pip install openai
export OPENAI_API_KEY="sk-..."
```

## Tips
- Use higher temperature (0.7–1.0) for generate/mutate nodes (creativity)
- Use lower temperature (0.3–0.5) for reflect node (analytical)
- Handle `openai.RateLimitError` with exponential backoff
