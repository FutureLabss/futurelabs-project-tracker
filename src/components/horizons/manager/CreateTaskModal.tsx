// src/components/horizons/manager/CreateTaskModal.tsx

import { useState } from "react";

import {
  Button,
  Modal,
  Select,
  TextInput,
  Textarea,
} from "@mantine/core";

type CreateTaskModalProps = {
  opened: boolean;
  onClose: () => void;
  managerName: string;
  onTaskCreated: (task: CreatedTask) => void;
};


// ============================================
// TASK TYPE
// ============================================

export type CreatedTask = {
  project: string;
  title: string;
  description: string;
  assignee: string;
  complexity: string;
  points: number;
  origin: string;
  dueDate: string;
};


// ============================================
// PROJECT OPTIONS
// ============================================

const projectOptions = [
  {
    value: "iam-v2",
    label: "Identity & Access Engine (IAM v2)",
  },
  {
    value: "mobile-sdk",
    label: "Mobile SDK Onboarding",
  },
  {
    value: "data-pipeline",
    label: "Data Ingestion & Analytics Pipeline",
  },
  {
    value: "payment-platform",
    label: "Payment Platform",
  },
];


// ============================================
// COMPONENT
// ============================================

export default function CreateTaskModal({
  opened,
  onClose,
  managerName,
  onTaskCreated,
}: CreateTaskModalProps) {

  // ------------------------------------------
  // Form state
  // ------------------------------------------

  const [project, setProject] = useState<string | null>(null);

  const [title, setTitle] = useState("");

  const [description, setDescription] = useState("");

  const [assignee, setAssignee] = useState<string | null>(
    managerName
  );

  const [complexity, setComplexity] = useState<string | null>(
    "2"
  );

  const [origin, setOrigin] = useState<string | null>(
    "planned"
  );

  const [dueDate, setDueDate] = useState("");


  // ------------------------------------------
  // Complexity options
  // ------------------------------------------

  const complexityOptions = [
    {
      value: "1",
      label: "Low (1 pt)",
    },
    {
      value: "2",
      label: "Mid (2 pts)",
    },
    {
      value: "3",
      label: "High (3 pts)",
    },
  ];


  // ------------------------------------------
  // Assignee options
  // ------------------------------------------

  const assigneeOptions = [
    {
      value: managerName,
      label: `${managerName} (manager)`,
    },
    {
      value: "Alex Chen",
      label: "Alex Chen",
    },
    {
      value: "Maya Patel",
      label: "Maya Patel",
    },
  ];


  // ------------------------------------------
  // Task origin options
  // ------------------------------------------

  const originOptions = [
    {
      value: "planned",
      label: "Planned (Sprint / Milestone)",
    },
    {
      value: "ad-hoc",
      label: "Ad-hoc",
    },
    {
      value: "production",
      label: "Production Issue",
    },
  ];


  // ------------------------------------------
  // Form validation
  // ------------------------------------------

  const canSubmit =
    project !== null &&
    title.trim().length > 0 &&
    complexity !== null &&
    origin !== null &&
    dueDate.trim().length > 0;


  // ------------------------------------------
  // Create task
  // ------------------------------------------

  const handleSubmit = () => {

    if (!canSubmit) {
      return;
    }


    const selectedProject = projectOptions.find(
      (item) => item.value === project
    );


    const selectedComplexity = complexityOptions.find(
      (item) => item.value === complexity
    );


    const task: CreatedTask = {
      project:
        selectedProject?.label ?? "Unknown Project",

      title: title.trim(),

      description:
        description.trim() ||
        "No description provided.",

      assignee:
        assignee ?? managerName,

      complexity:
        selectedComplexity?.label ?? "Mid (2 pts)",

      points:
        Number(complexity),

      origin:
        origin ?? "planned",

      dueDate,
    };


    // Send the newly-created task
    // back to ManagerDashboard.

    onTaskCreated(task);


    // Reset form

    setProject(null);

    setTitle("");

    setDescription("");

    setAssignee(managerName);

    setComplexity("2");

    setOrigin("planned");

    setDueDate("");

    // Close modal

    onClose();
  };


  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Task"
      centered
      size="lg"
      radius="md"
    >

      <div className="space-y-5">

        {/* =====================================
            PROJECT
        ===================================== */}

        <Select
          label="Project"
          placeholder="Select project"
          required
          data={projectOptions}
          value={project}
          onChange={setProject}
          searchable
        />


        {/* =====================================
            TASK TITLE
        ===================================== */}

        <TextInput
          label="Task Title"
          placeholder="e.g. Implement OIDC token exchange"
          required
          value={title}
          onChange={(event) =>
            setTitle(event.currentTarget.value)
          }
        />


        {/* =====================================
            DESCRIPTION
        ===================================== */}

        <Textarea
          label="Description / Scope"
          placeholder="Describe deliverables and acceptance criteria..."
          minRows={4}
          value={description}
          onChange={(event) =>
            setDescription(event.currentTarget.value)
          }
        />


        {/* =====================================
            ASSIGNEE + COMPLEXITY
        ===================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <Select
            label="Assignee"
            data={assigneeOptions}
            value={assignee}
            onChange={setAssignee}
          />


          <Select
            label="Complexity Weight"
            required
            data={complexityOptions}
            value={complexity}
            onChange={setComplexity}
          />

        </div>


        {/* =====================================
            ORIGIN + DUE DATE
        ===================================== */}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

          <Select
            label="Task Origin"
            required
            data={originOptions}
            value={origin}
            onChange={setOrigin}
          />


          <TextInput
            label="Due Date"
            type="date"
            required
            value={dueDate}
            onChange={(event) =>
              setDueDate(event.currentTarget.value)
            }
          />

        </div>


        {/* =====================================
            BUTTONS
        ===================================== */}

        <div className="flex justify-end gap-3 pt-3">

          <Button
            variant="default"
            onClick={onClose}
          >
            Cancel
          </Button>


          <Button
            color="teal"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Create Task
          </Button>

        </div>

      </div>

    </Modal>
  );
}