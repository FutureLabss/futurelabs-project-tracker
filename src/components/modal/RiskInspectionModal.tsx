// import { Badge, Stack, Text } from "@mantine/core";
// import { ReusableModal } from "./ReuseableModal";
// import type { RiskSignal } from "../../types/dashboard";

// interface RiskInspectionModalProps {
//   risk: RiskSignal | null;
//   onClose: () => void;
// }

// export function RiskInspectionModal({
//   risk,
//   onClose,
// }: RiskInspectionModalProps) {
//   if (!risk) return null;

//   const isCritical = risk.severity === "critical";

//   return (
//     <ReusableModal
//       opened={!!risk}
//       onClose={onClose}
//       title={risk.headline}
//       size="lg"
//     >
//       <Stack gap="md">
//         <Badge color={isCritical ? "red" : "yellow"} w="fit-content">
//           {isCritical ? "Critical" : "Warning"}
//         </Badge>

//         <Text size="sm">
//           <strong>Project:</strong> {risk.projectName}
//         </Text>
//         <Text size="sm">
//           <strong>Assignee:</strong> {risk.assigneeName}
//         </Text>
//         <Text size="sm">
//           <strong>Signal:</strong> {risk.signalType.replaceAll("_", " ")}
//         </Text>
//         <Text size="sm">{risk.details}</Text>
//       </Stack>
//     </ReusableModal>
//   );
// }