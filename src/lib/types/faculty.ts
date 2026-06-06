export type CardProps = {
  collegeId: number;

  collegeEducationId: number;
  collegeBranchId: number;
  branchCode: string;
  collegeAcademicYearId: number;
  collegeSemesterId: number;

  collegeSubjectId: number;
  collegeSectionId?: number;

  subjectTitle: string;
  semester: string;
  year: string;
  sectionName?: string;

  units: number;
  topicsCovered: number;
  topicsTotal: number;
  nextLesson: string;
  students: number;
  percentage: number;
  fromDate: string;
  toDate: string;
};
