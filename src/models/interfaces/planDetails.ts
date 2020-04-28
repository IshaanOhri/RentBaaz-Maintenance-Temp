export interface PlanDetail{
    plan : {
        planID: string;
        cost: number;
        planName: string;
        description: string;
    }
    planProducts: string[];
}