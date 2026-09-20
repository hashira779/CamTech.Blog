import json
import math
import uuid
import base64
import urllib.parse
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.tool import Tool

class ToolService:
    @staticmethod
    def get_tools(db: Session, category: Optional[str] = None) -> List[Tool]:
        query = db.query(Tool).filter(Tool.is_active == True)
        if category:
            query = query.filter(Tool.category == category.upper())
        return query.order_by(Tool.name).all()

    @staticmethod
    def get_tool_by_slug(db: Session, slug: str) -> Optional[Tool]:
        return db.query(Tool).filter(Tool.slug == slug).first()

    @staticmethod
    def record_tool_usage(db: Session, slug: str):
        tool = db.query(Tool).filter(Tool.slug == slug).first()
        if tool:
            tool.usage_count += 1
            db.commit()

    @staticmethod
    def execute_tool(slug: str, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Server-side real calculation and execution engine for tools.
        """
        slug = slug.lower().strip()

        # 1. Percentage Calculator
        if slug == "percentage-calculator":
            calc_type = params.get("calc_type", "what_is_p_of_x")
            if calc_type == "what_is_p_of_x":
                p = float(params.get("percent", 0))
                x = float(params.get("value", 0))
                result = (p / 100.0) * x
                return {"result": round(result, 4), "formatted": f"{p}% of {x} is {result:,.2f}"}
            elif calc_type == "x_is_what_percent_of_y":
                x = float(params.get("part", 0))
                y = float(params.get("whole", 0))
                if y == 0: return {"error": "Denominator cannot be zero"}
                result = (x / y) * 100.0
                return {"result": round(result, 4), "formatted": f"{x} is {result:.2f}% of {y}"}
            elif calc_type == "percentage_increase_decrease":
                old_val = float(params.get("old_value", 0))
                new_val = float(params.get("new_value", 0))
                if old_val == 0: return {"error": "Original value cannot be zero"}
                diff = new_val - old_val
                pct = (diff / old_val) * 100.0
                direction = "increase" if pct >= 0 else "decrease"
                return {"result": round(pct, 2), "direction": direction, "formatted": f"{abs(pct):.2f}% {direction}"}

        # 2. Loan / EMI Calculator
        elif slug == "loan-calculator":
            principal = float(params.get("principal", 10000))
            annual_rate = float(params.get("annual_rate", 8.0))
            tenure_months = int(params.get("tenure_months", 36))
            monthly_rate = (annual_rate / 100.0) / 12.0
            if monthly_rate == 0:
                emi = principal / tenure_months
            else:
                emi = (principal * monthly_rate * ((1 + monthly_rate) ** tenure_months)) / (((1 + monthly_rate) ** tenure_months) - 1)
            total_payment = emi * tenure_months
            total_interest = total_payment - principal
            return {
                "monthly_emi": round(emi, 2),
                "total_payment": round(total_payment, 2),
                "total_interest": round(total_interest, 2),
                "formatted_emi": f"${emi:,.2f}/month"
            }

        # 3. Discount Calculator
        elif slug == "discount-calculator":
            original_price = float(params.get("original_price", 0))
            discount_pct = float(params.get("discount_percentage", 0))
            savings = (original_price * discount_pct) / 100.0
            final_price = original_price - savings
            return {
                "savings": round(savings, 2),
                "final_price": round(final_price, 2),
                "formatted": f"Final Price: ${final_price:,.2f} (Saved ${savings:,.2f})"
            }

        # 4. JSON Formatter / Validator
        elif slug in ["json-formatter", "json-validator"]:
            raw = params.get("input", "")
            try:
                parsed = json.loads(raw)
                formatted = json.dumps(parsed, indent=2, ensure_ascii=False)
                return {"valid": True, "formatted": formatted}
            except Exception as e:
                return {"valid": False, "error": str(e)}

        # 5. Base64 Encoder/Decoder
        elif slug == "base64-converter":
            mode = params.get("mode", "encode")
            text = params.get("text", "")
            if mode == "encode":
                encoded = base64.b64encode(text.encode("utf-8")).decode("utf-8")
                return {"result": encoded}
            else:
                try:
                    decoded = base64.b64decode(text.encode("utf-8")).decode("utf-8")
                    return {"result": decoded}
                except Exception as e:
                    return {"error": f"Invalid Base64 string: {str(e)}"}

        # 6. UUID Generator
        elif slug == "uuid-generator":
            count = min(int(params.get("count", 1)), 50)
            uuids = [str(uuid.uuid4()) for _ in range(count)]
            return {"uuids": uuids}

        return {"error": f"Tool computation not implemented for slug: {slug}"}
