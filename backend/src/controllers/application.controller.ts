import { Request, Response, NextFunction } from 'express';
import { applicationRepository } from '../database/repositories.js';
import { documentService } from '../services/document.service.js';
import { checklistService } from '../services/checklist.service.js';
import type { ApplicantData, ApiResponse, Application } from '../types/index.js';

export class ApplicationController {
  /**
   * Create a new application
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { cluid, applicantData } = req.body as {
        cluid: string;
        applicantData: ApplicantData;
      };

      if (!cluid || !applicantData) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_REQUEST', message: 'cluid and applicantData are required' },
        } as ApiResponse<null>);
      }

      const application = applicationRepository.create(cluid, applicantData);

      return res.status(201).json({
        success: true,
        data: application,
      } as ApiResponse<Application>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get application by ID
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const application = applicationRepository.findById(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' },
        } as ApiResponse<null>);
      }

      return res.json({
        success: true,
        data: application,
      } as ApiResponse<Application>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get applications by CLUID
   */
  async getByCluid(req: Request, res: Response, next: NextFunction) {
    try {
      const cluid = req.params.cluid as string;
      const applications = applicationRepository.findByCluid(cluid);

      return res.json({
        success: true,
        data: applications,
      } as ApiResponse<Application[]>);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get application document summary
   */
  async getDocumentSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const summary = await documentService.getApplicationDocumentSummary(id);

      if (!summary) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' },
        } as ApiResponse<null>);
      }

      return res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update application status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status } = req.body;

      const application = applicationRepository.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' },
        } as ApiResponse<null>);
      }

      applicationRepository.updateStatus(id, status);

      return res.json({
        success: true,
        data: applicationRepository.findById(id),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh application checklist
   */
  async refreshChecklist(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;

      const application = applicationRepository.findById(id);
      if (!application) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Application not found' },
        } as ApiResponse<null>);
      }

      const checklistStatus = await documentService.updateApplicationChecklist(id);
      const completeness = checklistService.calculateOverallCompleteness(checklistStatus);
      const missingDocs = checklistService.getMissingDocuments(checklistStatus);

      return res.json({
        success: true,
        data: {
          checklistStatus,
          completeness,
          missingDocuments: missingDocs,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const applicationController = new ApplicationController();
