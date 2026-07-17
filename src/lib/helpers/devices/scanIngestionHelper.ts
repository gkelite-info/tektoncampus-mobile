import { supabase } from "@/lib/supabaseClient";

export const adminSupabase = supabase;


export interface DeviceRow {
  deviceId: number;
  collegeId: number;
  deviceCategory: "classroom" | "gate";
  deviceSerialNumber: string;
  deviceIp: string;
  isActive: boolean;
  is_deleted: boolean;
  gateDirection: "In" | "Out" | "Standalone" | null;
  isOnline: boolean;
  lastHeartbeat: string | null;
}

export interface CredentialLookupResult {
  userId: number;
  collegeId: number;
  isActive: boolean;
}

export interface PendingLogPayload {
  deviceId: number;
  userId: number | null;
  collegeId: number;
  logType: "classattendance" | "gateentry" | "gateexit";
  authMethod: "fingerprint" | "facerecognition" | "card" | "manual";
  scanTimestamp: string;
  rawDeviceData?: Record<string, unknown>;
}

export interface LogUpdatePayload {
  deviceAttendanceLogId: number;
  processedStatus: "accepted" | "rejected" | "error";
  rejectionReason?: string;
  calendarEventId?: number | null;
  deviceClassSessionId?: number | null;
  attendanceRecordId?: number | null;
  gateScanLogId?: number | null;
  attendanceDailyId?: number | null;
  logType?: "classattendance" | "gateentry" | "gateexit";
}


export async function validateAndLookupDevice(
  deviceSerialNumber: string,
): Promise<DeviceRow | null> {
  const { data, error } = await adminSupabase
    .from("biometric_devices")
    .select(
      "deviceId, collegeId, deviceCategory, deviceSerialNumber, deviceIp, isActive, is_deleted, gateDirection, isOnline, lastHeartbeat",
    )
    .eq("deviceSerialNumber", deviceSerialNumber)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!data || data.is_deleted || !data.isActive) return null;
  return data as DeviceRow;
}


export async function validateAndLookupDeviceById(
  deviceId: number,
): Promise<DeviceRow | null> {
  const { data, error } = await adminSupabase
    .from("biometric_devices")
    .select(
      "deviceId, collegeId, deviceCategory, deviceSerialNumber, deviceIp, isActive, is_deleted, gateDirection, isOnline, lastHeartbeat",
    )
    .eq("deviceId", deviceId)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!data || data.is_deleted || !data.isActive) return null;
  return data as DeviceRow;
}


export async function validateAndLookupDeviceByIp(
  deviceIp: string,
): Promise<DeviceRow | null> {
  const { data, error } = await adminSupabase
    .from("biometric_devices")
    .select(
      "deviceId, collegeId, deviceCategory, deviceSerialNumber, deviceIp, isActive, is_deleted, gateDirection, isOnline, lastHeartbeat",
    )
    .or(`deviceIp.eq.${deviceIp},deviceIp.eq.http://${deviceIp},deviceIp.eq.https://${deviceIp}`)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!data || data.is_deleted || !data.isActive) return null;
  return data as DeviceRow;
}


export async function updateDeviceIp(
  deviceId: number,
  deviceIp: string,
): Promise<void> {
  const { error } = await adminSupabase
    .from("biometric_devices")
    .update({ deviceIp, updatedAt: new Date().toISOString() })
    .eq("deviceId", deviceId);

  if (error) {
  }
}


export async function lookupUserByEmployeeNo(
  employeeNo: string,
  collegeId: number,
): Promise<CredentialLookupResult | null> {
  const userId = parseInt(employeeNo, 10);
  if (isNaN(userId)) return null;

  const { data, error } = await adminSupabase
    .from("users")
    .select("userId, collegeId, isActive, is_deleted")
    .eq("userId", userId)
    .eq("collegeId", collegeId)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!data || data.is_deleted || !data.isActive) return null;
  
  return {
    userId: data.userId,
    collegeId: data.collegeId,
    isActive: data.isActive,
  };
}


export async function lookupUserByCredential(
  credentialIdentifier: string,
  collegeId: number,
): Promise<CredentialLookupResult | null> {
  const { data, error } = await adminSupabase
    .from("user_device_credentials")
    .select("userId, collegeId, isActive")
    .eq("credentialIdentifier", credentialIdentifier)
    .eq("collegeId", collegeId)
    .eq("isActive", true)
    .is("deletedAt", null)
    .maybeSingle();

  if (error) {
    return null;
  }
  if (!data) return null;
  return data as CredentialLookupResult;
}


export async function insertPendingLog(
  payload: PendingLogPayload,
): Promise<number | null> {
  const now = new Date().toISOString();

  const { data, error } = await adminSupabase
    .from("device_attendance_logs")
    .insert({
      deviceId: payload.deviceId,
      userId: payload.userId,
      collegeId: payload.collegeId,
      logType: payload.logType,
      authMethod: payload.authMethod,
      scanTimestamp: payload.scanTimestamp,
      processedStatus: "pending",
      rawDeviceData: payload.rawDeviceData ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .select("deviceAttendanceLogId")
    .single();

  if (error) {
    return null;
  }
  return data.deviceAttendanceLogId;
}


export async function updateLogStatus(
  update: LogUpdatePayload,
): Promise<void> {
  const { deviceAttendanceLogId, processedStatus, ...rest } = update;
  const now = new Date().toISOString();

  const patch: Record<string, unknown> = {
    processedStatus,
    updatedAt: now,
  };

  if (rest.rejectionReason !== undefined) patch.rejectionReason = rest.rejectionReason;
  if (rest.calendarEventId !== undefined) patch.calendarEventId = rest.calendarEventId;
  if (rest.deviceClassSessionId !== undefined)
    patch.deviceClassSessionId = rest.deviceClassSessionId;
  if (rest.attendanceRecordId !== undefined)
    patch.attendanceRecordId = rest.attendanceRecordId;
  if (rest.gateScanLogId !== undefined) patch.gateScanLogId = rest.gateScanLogId;
  if (rest.attendanceDailyId !== undefined)
    patch.attendanceDailyId = rest.attendanceDailyId;
  if (rest.logType !== undefined)
    patch.logType = rest.logType;

  await adminSupabase
    .from("device_attendance_logs")
    .update(patch)
    .eq("deviceAttendanceLogId", deviceAttendanceLogId);
}


export async function getUserRole(
  userId: number,
): Promise<string | null> {
  const { data, error } = await adminSupabase
    .from("users")
    .select("role")
    .eq("userId", userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.role;
}


export async function insertRetryQueue(
  collegeId: number,
  rawPayload: any,
  failureReason: string,
): Promise<void> {
  const { error } = await adminSupabase.from("scan_retry_queue").insert({
    collegeId,
    rawPayload,
    failureReason,
    createdAt: new Date().toISOString(),
  });

  if (error) {
  }
}

