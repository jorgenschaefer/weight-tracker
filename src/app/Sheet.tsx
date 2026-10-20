import { Drawer } from "@mantine/core";
import classes from "./Sheet.module.css";

/**
 * A light sheet from the bottom, under `title`, only as tall as its content.
 * The X, Escape and a tap beside the sheet all close it through `onClose`.
 */
export function Sheet({
  title,
  opened,
  onClose,
  children,
}: {
  title: string;
  opened: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      position="bottom"
      // Only as tall as its content. Mantine's `size="auto"` would name a
      // variable `--drawer-size-auto` that Mantine never defines.
      vars={() => ({ root: { "--drawer-size": "auto" } })}
      overlayProps={{ color: "#20262c", backgroundOpacity: 0.35 }}
      title={title}
      closeButtonProps={{ "aria-label": "Schließen" }}
      classNames={{
        content: classes.sheet,
        header: classes.part,
        title: classes.title,
        body: classes.part,
      }}
    >
      {children}
    </Drawer>
  );
}
