"""
routers/upload.py
-----------------
Upload Router — handles file upload endpoint.

Endpoint:
  POST /upload
    Accepts multipart form data with:
      - buggy_file : Python (.py) file containing the buggy code
      - test_file  : Python (.py) file containing the unit tests

    Returns:
      - session_id  : UUID string identifying this evaluation session
      - filename    : Original name of the buggy file
      - test_filename: Original name of the test file
      - message     : Confirmation message

The uploaded content is stored in the BugUploads table.
The session_id is used to link all subsequent evaluation results.
"""

import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app import models, schemas

# Create router with /upload prefix and "upload" tag for API docs
router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("", response_model=schemas.UploadResponse)
async def upload_files(
    buggy_file: UploadFile = File(..., description="Buggy Python source file"),
    test_file: UploadFile  = File(..., description="Unit test Python file"),
    db: Session = Depends(get_db)
):
    """
    Upload a buggy Python file and its corresponding unit test file.

    This creates a new evaluation session and stores the files in the database.
    Returns a session_id to be used in subsequent /baseline/run and
    /trustpatch/evaluate API calls.
    """
    # Validate file extensions
    if not buggy_file.filename.endswith(".py"):
        raise HTTPException(
            status_code=400,
            detail="Buggy file must be a Python (.py) file"
        )
    if not test_file.filename.endswith(".py"):
        raise HTTPException(
            status_code=400,
            detail="Test file must be a Python (.py) file"
        )

    # Read file contents
    buggy_content = await buggy_file.read()
    test_content  = await test_file.read()

    try:
        buggy_code = buggy_content.decode("utf-8")
        test_code  = test_content.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=400,
            detail="Files must be valid UTF-8 encoded Python source files"
        )

    # Validate that files are non-empty
    if not buggy_code.strip():
        raise HTTPException(status_code=400, detail="Buggy file is empty")
    if not test_code.strip():
        raise HTTPException(status_code=400, detail="Test file is empty")

    # Generate unique session ID for this evaluation run
    session_id = str(uuid.uuid4())

    # Persist to database
    upload_record = models.BugUpload(
        session_id    = session_id,
        filename      = buggy_file.filename,
        test_filename = test_file.filename,
        content       = buggy_code,
        test_content  = test_code,
    )
    db.add(upload_record)
    db.commit()
    db.refresh(upload_record)

    return schemas.UploadResponse(
        session_id    = session_id,
        filename      = buggy_file.filename,
        test_filename = test_file.filename,
        message       = (
            f"Files uploaded successfully. Session ID: {session_id}. "
            "Use this session_id to run BAPR and TrustPatch evaluation."
        )
    )
