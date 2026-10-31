export interface CameraPageProps {
  onSave: (imageUrl: string, note: string) => void | Promise<void>
  onBack: () => void
}
