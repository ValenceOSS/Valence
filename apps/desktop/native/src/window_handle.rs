/// Reads the address Electron's `getNativeWindowHandle` hands over, the window's `HWND`, as the bytes
/// of a pointer in this machine's own order.
///
/// Returns nothing for anything that is not exactly a pointer's width.
#[cfg_attr(
    not(windows),
    allow(
        dead_code,
        reason = "only Windows draws a system prompt over the window"
    )
)]
pub fn window_handle(bytes: &[u8]) -> Option<usize> {
    bytes.try_into().ok().map(usize::from_ne_bytes)
}

#[cfg(test)]
mod tests {
    use super::window_handle;

    #[test]
    fn reads_a_pointer_width_of_bytes() {
        let handle = 0x1234_usize;

        assert_eq!(window_handle(&handle.to_ne_bytes()), Some(0x1234));
    }

    #[test]
    fn refuses_anything_else() {
        assert_eq!(window_handle(&[1, 2, 3]), None);
    }
}
