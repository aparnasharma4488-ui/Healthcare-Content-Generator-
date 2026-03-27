from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from . import vector_db

app = FastAPI(title="MedScribe API")

# Setup CORS to allow the frontend to communicate
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow any origin (e.g. localhost:3000)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PatientData(BaseModel):
    patientName: str = ""
    age: str = ""
    gender: str = ""
    visitDate: str = ""
    chiefComplaint: str = ""
    hpi: str = ""
    medicalHistory: str = ""
    bp: str = ""
    hr: str = ""
    temp: str = ""
    rr: str = ""
    spo2: str = ""
    physicalExam: str = ""
    assessment: str = ""
    plan: str = ""

@app.post("/api/generate-report")
async def generate_report(data: PatientData):
    # Simulated GAN AI generation based on patient data
    report_lines = []
    if data.patientName and data.age and data.gender:
        report_lines.append(f"Patient {data.patientName}, a {data.age} y/o {data.gender}, presented with {data.chiefComplaint or 'no specific complaint'}.")
    
    if data.hpi:
        report_lines.append(f"\nHistory of Present Illness:\n{data.hpi}")
    if data.medicalHistory:
        report_lines.append(f"\nPast Medical History:\n{data.medicalHistory}")
        
    # Vitals
    vitals = []
    if data.bp: vitals.append(f"BP {data.bp}")
    if data.hr: vitals.append(f"HR {data.hr}")
    if data.temp: vitals.append(f"Temp {data.temp}")
    if data.rr: vitals.append(f"RR {data.rr}")
    if data.spo2: vitals.append(f"SpO2 {data.spo2}%")
    if vitals:
        report_lines.append("\nVitals: " + ", ".join(vitals))
        
    if data.physicalExam:
        report_lines.append(f"\nPhysical Exam:\n{data.physicalExam}")
    if data.assessment:
        report_lines.append(f"\nAssessment:\n{data.assessment}")
    if data.plan:
        report_lines.append(f"\nPlan:\n{data.plan}")
        
    report_text = "\n".join(report_lines)
    if not report_text.strip():
        report_text = "No clinical data provided."

    # Interacting with Vector Store
    # We store the generated clinical summary
    report_id = vector_db.add_report(
        report_text=report_text,
        metadata={"name": data.patientName, "age": data.age}
    )
    
    return {
        "status": "success", 
        "report": report_text, 
        "report_id": report_id,
        "message": "Report generated and added to Vector DB."
    }

@app.get("/api/search-similar")
async def search_similar(query: str):
    """
    Finds similar patient reports based on semantic search.
    """
    results = vector_db.search_similar_reports(query_text=query, n_results=3)
    return {"status": "success", "results": results}
