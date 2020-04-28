export interface Complaint {
    complaintID: string;
    userID: string;
    productID: string;
    businessName: string;
    productName: string;
    faults: string;
    probDesc: string;
    dateOfComplaint: number;
    dateOfMaintenance: number;
    status: boolean;
    cost: number;
}