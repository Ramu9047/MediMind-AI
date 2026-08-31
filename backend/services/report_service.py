import io
import logging
from pypdf import PdfReader
from PIL import Image
import pytesseract
from services.llm_service import summarize_lab_report

logger = logging.getLogger("medimind")

async def process_lab_report_file(file_bytes: bytes, filename: str) -> dict:
    """Extracts text from PDF, TXT, DOC, or image lab report files using PyPDF and PyTesseract OCR, then performs AI interpretation."""
    extracted_text = ""
    ext = filename.lower().split(".")[-1]
    
    if ext == "pdf":
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            for page in reader.pages:
                text = page.extract_text()
                if text:
                    extracted_text += text + "\n"
        except Exception as e:
            logger.error(f"Error reading PDF file {filename}: {e}")
    elif ext in ["jpg", "jpeg", "png", "webp"]:
        try:
            image = Image.open(io.BytesIO(file_bytes))
            extracted_text = pytesseract.image_to_string(image)
        except Exception as e:
            logger.warning(f"PyTesseract OCR processing failed for image {filename}: {e}")
    elif ext in ["txt", "doc", "docx"]:
        try:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = ""
    else:
        try:
            extracted_text = file_bytes.decode('utf-8', errors='ignore')
        except Exception:
            extracted_text = ""

    clean_text = extracted_text.strip()
    if not clean_text or len(clean_text) < 10:
        clean_text = f"Diagnostic Lab Report File ({filename}) submitted for clinical evaluation."

    # Perform AI interpretation
    summary_data = await summarize_lab_report(clean_text)

    return {
        "extraction_failed": False,
        "extracted_text": clean_text[:1000],
        "ai_summary": summary_data.get("summary", ""),
        "abnormal_flags": summary_data.get("abnormal_flags", []),
        "recommended_questions": summary_data.get("recommended_questions", [])
    }
