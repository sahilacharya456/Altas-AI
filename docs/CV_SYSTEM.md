# AltasAI CV / Document AI

The Python ML service includes a CV adapter layer:

- image payload validation
- OCR adapter
- screenshot analyzer
- document image analyzer
- chart analyzer placeholder

Current status:

- If OCR text is provided, AltasAI extracts entities from it.
- If only raw image data is provided, the service returns `provider: not_configured` and explains the limitation.
- OpenCV is not installed in this local environment, so raw OCR is not claimed.

This is the correct architecture boundary: provider interface first, real OCR provider later.
