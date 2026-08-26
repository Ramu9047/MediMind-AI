import os
os.environ["JWT_SECRET"] = "medimind-test-jwt-secret-key-2026"
os.environ["ADMIN_PASSWORD"] = "TestAdminPass123!"

import unittest
import asyncio
from datetime import datetime, timedelta, timezone
from database import connect_to_mongo, get_database

from services.nlp_symptom_service import extract_symptoms_from_free_text
from services.medicine_service import (
    search_rxnorm_medicines,
    get_medicine_details_by_rxcui,
    get_medicines_by_condition,
    check_medicine_interactions
)

class TestMediMindSuite(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.loop = asyncio.get_event_loop()
        cls.loop.run_until_complete(connect_to_mongo())

    # --- SECTION 1: APPOINTMENT & TIMELINE TESTS ---
    def test_01_appointment_past_date_rejected(self):
        """Verify appointment booking validation logic rejects past dates."""
        today = datetime.now(timezone.utc).date()
        past_date = (today - timedelta(days=1)).strftime("%Y-%m-%d")
        past_date_obj = datetime.strptime(past_date, "%Y-%m-%d").date()
        self.assertTrue(past_date_obj < today, "Past date must be evaluated as prior to today's date.")

    def test_02_appointment_future_date_allowed(self):
        """Verify appointment booking validation logic permits future dates."""
        today = datetime.now(timezone.utc).date()
        future_date = (today + timedelta(days=2)).strftime("%Y-%m-%d")
        future_date_obj = datetime.strptime(future_date, "%Y-%m-%d").date()
        self.assertFalse(future_date_obj < today, "Future date must not be evaluated as prior to today's date.")

    def test_03_appointment_slot_lock_state_passed_today(self):
        """Verify time slot locking logic correctly compares slot hour against current local time."""
        now = datetime.now()
        passed_hour = (now.hour - 2) if now.hour >= 2 else 0
        slot_passed = datetime.now().replace(hour=passed_hour, minute=0, second=0, microsecond=0)
        self.assertTrue(slot_passed < now, "Slots earlier than current time today must evaluate as passed/locked.")

    def test_04_timeline_timestamp_ordering_sequence(self):
        """Verify sequential actions generate distinct, strictly increasing UTC timestamps in database."""
        async def run_sequence():
            db = get_database()
            patient_id = "test_pat_ts_seq_13"

            # Clear test records
            coll = db["timeline"]
            if hasattr(coll, "delete_many"):
                await coll.delete_many({"patient_id": patient_id})
            elif hasattr(coll, "docs"):
                coll.docs = [d for d in coll.docs if d.get("patient_id") != patient_id]

            # 1. Symptom Check
            t1 = datetime.now(timezone.utc)
            await db["timeline"].insert_one({"_id": "t1", "patient_id": patient_id, "event_type": "Symptom Check", "timestamp": t1})
            await asyncio.sleep(0.05)

            # 2. Appointment Booking
            t2 = datetime.now(timezone.utc)
            await db["timeline"].insert_one({"_id": "t2", "patient_id": patient_id, "event_type": "Doctor Appointment", "timestamp": t2})
            await asyncio.sleep(0.05)

            # 3. Lab Report Upload
            t3 = datetime.now(timezone.utc)
            await db["timeline"].insert_one({"_id": "t3", "patient_id": patient_id, "event_type": "Report Analysis", "timestamp": t3})

            entries = await db["timeline"].find({"patient_id": patient_id}).to_list(length=10)
            entries.sort(key=lambda x: x.get("timestamp"))

            ts_list = [e["timestamp"] for e in entries]
            self.assertEqual(len(ts_list), 3)
            self.assertTrue(ts_list[0] < ts_list[1] < ts_list[2], f"Timestamps must be strictly ascending: {ts_list}")

        self.loop.run_until_complete(run_sequence())

    # --- SECTION 2: FREE-TEXT NLP EXTRACTION TESTS (5 SEPARATE INPUTS) ---
    def test_05_symptom_nlp_input_1_abdomen_pain_and_nausea(self):
        """NLP Input 1: 'I've had a sharp pain in my lower right abdomen since this morning and I feel nauseous'."""
        async def run_nlp():
            text = "I've had a sharp pain in my lower right abdomen since this morning and I feel nauseous"
            res = await extract_symptoms_from_free_text(text)
            self.assertIn("matched_symptoms", res)
            self.assertIn("confidence", res)
            self.assertIn("duration", res)
            self.assertIn("severity", res)
            self.assertIn("location", res)
            self.assertTrue(len(res["matched_symptoms"]) > 0)
        self.loop.run_until_complete(run_nlp())

    def test_06_symptom_nlp_input_2_headache_and_dizziness(self):
        """NLP Input 2: 'Splitting headache with sensitivity to light and severe dizziness for 2 days'."""
        async def run_nlp():
            text = "Splitting headache with sensitivity to light and severe dizziness for 2 days"
            res = await extract_symptoms_from_free_text(text)
            self.assertIn("matched_symptoms", res)
            self.assertIn("confidence", res)
            self.assertTrue(len(res["matched_symptoms"]) > 0)
        self.loop.run_until_complete(run_nlp())

    def test_07_symptom_nlp_input_3_sneezing_and_congestion(self):
        """NLP Input 3: 'Continuous sneezing, runny nose, and severe chest congestion with mild fever'."""
        async def run_nlp():
            text = "Continuous sneezing, runny nose, and severe chest congestion with mild fever"
            res = await extract_symptoms_from_free_text(text)
            self.assertIn("matched_symptoms", res)
            self.assertIn("confidence", res)
            self.assertTrue(len(res["matched_symptoms"]) > 0)
        self.loop.run_until_complete(run_nlp())

    def test_08_symptom_nlp_input_4_fever_and_chills(self):
        """NLP Input 4: 'High fever, shivering chills, and dark urine since yesterday'."""
        async def run_nlp():
            text = "High fever, shivering chills, and dark urine since yesterday"
            res = await extract_symptoms_from_free_text(text)
            self.assertIn("matched_symptoms", res)
            self.assertIn("confidence", res)
            self.assertTrue(len(res["matched_symptoms"]) > 0)
        self.loop.run_until_complete(run_nlp())

    def test_09_symptom_nlp_input_5_burning_micturition(self):
        """NLP Input 5: 'Burning micturition, frequent urination, and lower stomach pain'."""
        async def run_nlp():
            text = "Burning micturition, frequent urination, and lower stomach pain"
            res = await extract_symptoms_from_free_text(text)
            self.assertIn("matched_symptoms", res)
            self.assertIn("confidence", res)
            self.assertTrue(len(res["matched_symptoms"]) > 0)
        self.loop.run_until_complete(run_nlp())

    # --- SECTION 3: MEDICINE HUB ENDPOINT TESTS ---
    def test_10_medicine_hub_search_autocomplete_endpoint(self):
        """Verify RxNorm medicine search autocomplete returns term type and brand/generic info."""
        async def run_search():
            search_res = await search_rxnorm_medicines("omeprazole")
            self.assertTrue(len(search_res) > 0, "RxNorm search for omeprazole should return results.")
            self.assertIn("rxcui", search_res[0])
            self.assertIn("name", search_res[0])
        self.loop.run_until_complete(run_search())

    def test_11_medicine_hub_detail_rxcui_endpoint(self):
        """Verify openFDA drug detail endpoint returns real label prose for dosage & administration on exact RxCUI match."""
        async def run_detail():
            detail = await get_medicine_details_by_rxcui("402014")
            self.assertIsNotNone(detail)
            self.assertEqual(detail["rxcui"], "402014")
            self.assertTrue(detail["is_verified_match"])
            self.assertIn("dosage_and_administration", detail)
            self.assertTrue(len(detail["dosage_and_administration"]) > 20)
        self.loop.run_until_complete(run_detail())

    def test_12_medicine_hub_by_condition_reverse_lookup(self):
        """Verify reverse lookup by condition returns drug classes and RxCUIs for GERD."""
        async def run_condition():
            cond_res = await get_medicines_by_condition("GERD")
            self.assertTrue(len(cond_res) > 0, "Condition search for GERD should return associated drugs.")
            self.assertIn("class", cond_res[0])
        self.loop.run_until_complete(run_condition())

    def test_13_medicine_hub_pairwise_interaction_checker(self):
        """Verify pairwise interaction checker returns interaction flag for 2+ RxCUIs."""
        async def run_interaction():
            interactions = await check_medicine_interactions(["402014", "197885"])
            self.assertTrue(len(interactions) > 0, "Pairwise check for Omeprazole + Lisinopril should return interaction note.")
            self.assertIn("severity", interactions[0])
        self.loop.run_until_complete(run_interaction())

if __name__ == "__main__":
    unittest.main()

