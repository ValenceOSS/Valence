//! Hands the page buffers in the module's memory to write packets into and read samples out of.

use std::alloc::{alloc, dealloc, Layout};

/// The layout of a buffer of `length` bytes, or nothing where no such buffer can exist.
fn layout_of(length: usize) -> Option<Layout> {
    Layout::from_size_align(length.max(1), 8).ok()
}

/// Gives the page a buffer of `length` bytes in the module's memory, for it to write into.
///
/// Returns null where the buffer cannot be made.
#[no_mangle]
pub extern "C" fn buffer_new(length: usize) -> *mut u8 {
    match layout_of(length) {
        // SAFETY: the layout has a non-zero size, which is all `alloc` requires.
        Some(layout) => unsafe { alloc(layout) },
        None => std::ptr::null_mut(),
    }
}

/// Takes back a buffer `buffer_new` gave out, with the length it was given for.
///
/// # Safety
///
/// `buffer` must be null or a buffer `buffer_new` returned for this same `length`, not yet freed.
#[no_mangle]
pub unsafe extern "C" fn buffer_free(buffer: *mut u8, length: usize) {
    if buffer.is_null() {
        return;
    }

    if let Some(layout) = layout_of(length) {
        // SAFETY: the caller returns an unfreed `buffer_new` buffer of this length, so this layout.
        unsafe { dealloc(buffer, layout) }
    }
}
