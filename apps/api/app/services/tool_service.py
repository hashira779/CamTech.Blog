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
            tool.usage_count = (tool.usage_count or 0) + 1
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

        # 7. Compound Interest Calculator (2026-2029)
        elif slug == "compound-interest-calculator":
            principal = float(params.get("principal", 5000))
            monthly_deposit = float(params.get("monthly_deposit", 300))
            annual_rate = float(params.get("annual_rate", 8.5)) / 100.0
            years = int(params.get("years", 5))
            compounding = int(params.get("compounding", 12))

            balance = principal
            total_deposited = principal
            for _ in range(years):
                for m in range(12):
                    balance += monthly_deposit
                    total_deposited += monthly_deposit
                    if compounding == 12 or (compounding == 4 and m % 3 == 0) or (compounding == 1 and m == 11):
                        balance += balance * (annual_rate / compounding)
            interest = max(0.0, balance - total_deposited)
            return {
                "future_value": round(balance, 2),
                "total_principal": round(total_deposited, 2),
                "total_interest": round(interest, 2),
                "formatted": f"${balance:,.2f} total (${interest:,.2f} interest earned)"
            }

        # 8. Salary & Freelance Rate Calculator
        elif slug == "salary-freelance-calculator":
            target_net = float(params.get("target_net_annual", 48000))
            billable_hours = float(params.get("billable_hours_per_week", 28))
            vacation_weeks = float(params.get("vacation_weeks", 4))
            overhead_monthly = float(params.get("monthly_overhead", 250))
            tax_rate = float(params.get("tax_rate_pct", 15)) / 100.0
            buffer_rate = float(params.get("profit_buffer_pct", 10)) / 100.0

            working_weeks = max(1.0, 52.0 - vacation_weeks)
            annual_hours = working_weeks * billable_hours
            annual_overhead = overhead_monthly * 12.0
            gross_needed = ((target_net + annual_overhead) / max(0.01, 1.0 - tax_rate)) * (1.0 + buffer_rate)
            hourly_rate = gross_needed / annual_hours if annual_hours > 0 else 0.0

            return {
                "minimum_hourly_rate": round(hourly_rate, 2),
                "daily_rate": round(hourly_rate * 8, 2),
                "annual_gross_target": round(gross_needed, 2),
                "annual_billable_hours": round(annual_hours, 1),
                "formatted_rate": f"${hourly_rate:,.2f}/hr"
            }

        # 9. Cambodia Salary & Tax on Salary (ToS) Calculator
        elif slug in ["cambodia-salary-tax-calculator", "salary-tax-cambodia"]:
            gross = float(params.get("gross_salary", 1200))
            is_usd = params.get("currency", "USD").upper() == "USD"
            rate = float(params.get("exchange_rate", 4080))
            dependents = int(params.get("dependents", 0))

            gross_khr = gross * rate if is_usd else gross
            # NSSF employee pension (2% capped at 1,200,000 KHR)
            nssf_wage = min(gross_khr, 1_200_000)
            nssf_khr = nssf_wage * 0.02
            relief_khr = dependents * 150_000
            taxable_khr = max(0.0, gross_khr - nssf_khr - relief_khr)

            brackets = [
                (0, 1_500_000, 0.0),
                (1_500_000, 2_000_000, 0.05),
                (2_000_000, 8_500_000, 0.10),
                (8_500_000, 12_500_000, 0.15),
                (12_500_000, float("inf"), 0.20),
            ]
            tax_khr = 0.0
            for b_min, b_max, b_rate in brackets:
                if taxable_khr > b_min:
                    taxable_in_b = min(taxable_khr, b_max) - b_min
                    tax_khr += taxable_in_b * b_rate

            net_khr = gross_khr - nssf_khr - tax_khr
            net_usd = net_khr / rate
            tax_usd = tax_khr / rate

            return {
                "gross_usd": round(gross_khr / rate, 2),
                "gross_khr": round(gross_khr, 0),
                "nssf_pension_khr": round(nssf_khr, 0),
                "tax_on_salary_usd": round(tax_usd, 2),
                "tax_on_salary_khr": round(tax_khr, 0),
                "net_take_home_usd": round(net_usd, 2),
                "net_take_home_khr": round(net_khr, 0),
                "formatted": f"Net Salary: ${net_usd:,.2f} ({net_khr:,.0f} ៛)"
            }

        # 10. EDC Electricity Bill Calculator
        elif slug in ["edc-electricity-calculator", "cambodia-electricity-calculator"]:
            kwh = float(params.get("kwh", 150))
            rate = float(params.get("exchange_rate", 4080))
            tiers = [
                (0, 10, 380),
                (10, 50, 480),
                (50, 200, 610),
                (200, float("inf"), 730),
            ]
            total_khr = 0.0
            for t_min, t_max, t_rate in tiers:
                if kwh > t_min:
                    units = min(kwh, t_max) - t_min
                    total_khr += units * t_rate
            total_usd = total_khr / rate
            return {
                "total_kwh": kwh,
                "bill_khr": round(total_khr, 0),
                "bill_usd": round(total_usd, 2),
                "formatted": f"{total_khr:,.0f} ៛ (${total_usd:,.2f} USD)"
            }

        # 11. Cambodia USD/KHR Cash Change Calculator
        elif slug in ["cambodia-change-calculator", "khr-change-calculator"]:
            cost_usd = float(params.get("cost_usd", 6.25))
            paid_usd = float(params.get("paid_usd", 10.0))
            rate = float(params.get("exchange_rate", 4100))

            change_usd = paid_usd - cost_usd
            change_khr = round(change_usd * rate)
            whole_usd = int(max(0, change_usd))
            rem_khr = round((max(0, change_usd - whole_usd) * rate) / 100) * 100
            return {
                "change_usd": round(change_usd, 2),
                "change_khr": change_khr,
                "mixed_usd_bills": whole_usd,
                "mixed_khr_notes": rem_khr,
                "formatted": f"${whole_usd} USD + {rem_khr:,} KHR"
            }

        # 12. Crypto to KHR/USD Converter
        elif slug in ["crypto-khr-converter", "usdt-khr-converter"]:
            qty = float(params.get("crypto_amount", 500))
            crypto_price_usd = float(params.get("crypto_price_usd", 1.0))
            fx_rate = float(params.get("exchange_rate", 4080))
            fee_pct = float(params.get("fee_percent", 0.8))

            gross_usd = qty * crypto_price_usd
            gross_khr = gross_usd * fx_rate
            fee_usd = gross_usd * (fee_pct / 100.0)
            fee_khr = gross_khr * (fee_pct / 100.0)
            net_usd = max(0.0, gross_usd - fee_usd)
            net_khr = max(0.0, gross_khr - fee_khr)

            return {
                "crypto_amount": qty,
                "gross_usd": round(gross_usd, 2),
                "gross_khr": round(gross_khr, 0),
                "fee_usd": round(fee_usd, 2),
                "fee_khr": round(fee_khr, 0),
                "net_usd": round(net_usd, 2),
                "net_khr": round(net_khr, 0),
                "formatted": f"Net: ${net_usd:,.2f} USD ({net_khr:,.0f} ៛)"
            }


        # 10. URL Encoder / Decoder
        elif slug == "url-encoder":
            mode = params.get("mode", "encode")
            text = str(params.get("text", ""))
            if mode == "encode":
                return {"result": urllib.parse.quote(text)}
            else:
                return {"result": urllib.parse.unquote(text)}

        return {"error": f"Tool computation not implemented for slug: {slug}"}

