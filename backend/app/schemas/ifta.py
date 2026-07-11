from datetime import date, datetime

from pydantic import BaseModel, Field


class IFTARecordCreate(BaseModel):
    truck_id: int
    period_start: date
    period_end: date
    jurisdiction: str
    miles_driven: float = Field(gt=0)
    gallons_purchased: float = Field(ge=0)
    tax_rate_per_gallon: float = Field(ge=0)
    fleet_mpg: float | None = Field(default=None, gt=0)


class IFTARecordUpdate(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    jurisdiction: str | None = None
    miles_driven: float | None = Field(default=None, gt=0)
    gallons_purchased: float | None = Field(default=None, ge=0)
    tax_rate_per_gallon: float | None = Field(default=None, ge=0)
    fleet_mpg: float | None = Field(default=None, gt=0)


class IFTACalculation(BaseModel):
    taxable_gallons: float
    tax_due: float
    effective_mpg: float


class IFTARecordRead(BaseModel):
    id: int
    truck_id: int
    period_start: date
    period_end: date
    jurisdiction: str
    miles_driven: float
    gallons_purchased: float
    tax_rate_per_gallon: float
    fleet_mpg: float | None
    created_at: datetime
    calculations: IFTACalculation

    model_config = {"from_attributes": True}