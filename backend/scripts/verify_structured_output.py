"""
Manual verification script -- run this locally with a real OPENAI_API_KEY
and network access, which this sandbox does not have.

Purpose: exercise the actual model's judgment on the 5 challenge sample
tickets, with special attention to the case that matters most --
correctly distinguishing an ambiguous ticket (needs_follow_up=True) from
a sufficient one (needs_follow_up=False). Unit tests with a mocked client
(tests/test_ai_service.py) verify our CODE's control flow; only a live
call verifies the MODEL's judgment, which is what this script is for.

Usage:
    cd backend
    pip install -r requirements.txt
    export OPENAI_API_KEY=sk-...
    python -m scripts.verify_structured_output
"""

import json
import sys

from app.services.ai_service import AIServiceError, call_triage_model

SAMPLE_TICKETS = {
    "01_client_call": (
        "My laptop is connected to Wi-Fi but I can't access any websites. "
        "Teams isn't working either. I have a client call in 20 minutes.",
        "sufficient",  # expected: needs_follow_up should be False
    ),
    "02_password_outlook": (
        "I changed my password this morning. I can log into my laptop "
        "but Outlook keeps asking me for my password.",
        "sufficient",
    ),
    "03_slow_laptop": (
        "My laptop has become extremely slow since this morning. I only "
        "have Chrome, Outlook and Teams open.",
        "sufficient",
    ),
    "04_nothing_connecting": (
        "Nothing is connecting since I changed my password.",
        "ambiguous",  # vague enough that a follow-up is arguably warranted
    ),
    "05_internet_down": (
        "The internet is down.",
        "ambiguous",  # THE critical case -- must not produce a confident diagnosis
    ),
}


def run():
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
    print("Verifying structured-output contract against the real model.\n")
    mismatches = []

    for key, (message, expectation) in SAMPLE_TICKETS.items():
        print(f"--- {key} ---")
        print(f"Ticket: {message!r}")
        try:
            result = call_triage_model(message, [])
        except AIServiceError as exc:
            print(f"  AIServiceError: {exc}\n")
            mismatches.append((key, "AIServiceError", expectation))
            continue

        needs_follow_up = result.get("needs_follow_up")
        follow_up_q = result.get("follow_up_question")
        confidence = result.get("confidence")

        print(f"  category:            {result.get('category')}")
        print(f"  priority:             {result.get('priority')}")
        print(f"  confidence:           {confidence}")
        print(f"  needs_follow_up:      {needs_follow_up}")
        print(f"  follow_up_question:   {follow_up_q}")
        print(f"  issue_summary:        {result.get('issue_summary')}")
        print(f"  recommended_action:   {result.get('recommended_action')}")

        # The check that actually matters: an ambiguous ticket must not
        # get a confident, specific diagnosis; a sufficient one shouldn't
        # get stuck asking an unnecessary question.
        if expectation == "ambiguous":
            ok = needs_follow_up is True and follow_up_q
            if not ok:
                print("  !! FLAG: expected needs_follow_up=True with a "
                      "follow_up_question for an ambiguous ticket.")
                mismatches.append((key, "did not ask for missing info", expectation))
            # Extra check for the headline example: low confidence expected
            if key == "05_internet_down" and (confidence is None or confidence > 0.6):
                print(f"  !! FLAG: confidence={confidence} seems too high "
                      f"for a one-line, unscoped ticket.")
                mismatches.append((key, f"confidence too high ({confidence})", expectation))
        else:
            if needs_follow_up:
                print("  !! FLAG: expected a direct recommendation, but "
                      "model asked a follow-up question instead.")
                mismatches.append((key, "asked unnecessary follow-up", expectation))

        print()

    print("=" * 60)
    if mismatches:
        print(f"{len(mismatches)} ticket(s) did not match expectations:")
        for key, issue, expectation in mismatches:
            print(f"  - {key} (expected {expectation}): {issue}")
        print(
            "\nIf 05_internet_down or 04_nothing_connecting produced a "
            "confident diagnosis, revisit prompts/triage_prompt.py -- "
            "strengthen the evidence-vs-inference and confidence-calibration "
            "language before proceeding to Phase 4."
        )
    else:
        print("All tickets matched expectations. Structured-output "
              "contract verified against the live model.")


if __name__ == "__main__":
    run()
