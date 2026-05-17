import io
import re
from collections import Counter
import pdfplumber

def extract_text(file_bytes: bytes) -> str:
    """
    Extract text from PDF bytes or fallback to plain text.
    Cleans excessive whitespace and removes repeating headers/footers.
    """
    text = ""
    
    # 1. Try to open as PDF using pdfplumber
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception:
        # Fallback to plain text decoding if pdfplumber fails
        try:
            text = file_bytes.decode('utf-8')
        except UnicodeDecodeError:
            try:
                text = file_bytes.decode('latin-1')
            except Exception as e:
                raise ValueError(f"Failed to extract text: Could not parse as PDF or decode as plain text. {str(e)}")

    if not text.strip():
        raise ValueError("Failed to extract text: Document is empty or could not be read.")

    # 2. Clean the extracted text
    
    # Normalize newlines
    text = text.replace('\r\n', '\n')
    
    # Remove page headers/footers that repeat (heuristic: lines < 6 words appearing 3+ times)
    lines = text.split('\n')
    short_lines = [line.strip() for line in lines if line.strip() and len(line.strip().split()) < 6]
    line_counts = Counter(short_lines)
    repeating_headers_footers = {line for line, count in line_counts.items() if count >= 3}
    
    cleaned_lines = []
    for line in lines:
        if line.strip() not in repeating_headers_footers:
            cleaned_lines.append(line)
            
    cleaned_text = '\n'.join(cleaned_lines)
    
    # Remove excessive whitespace and blank lines (max 2 consecutive newlines)
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    
    # Strip leading/trailing whitespaces from the whole text
    cleaned_text = cleaned_text.strip()
    
    # 3. Check for minimum length
    if len(cleaned_text) < 100:
        raise ValueError("Failed to extract text: Extracted text is less than 100 characters. Document might be scanned or empty.")
        
    return cleaned_text
