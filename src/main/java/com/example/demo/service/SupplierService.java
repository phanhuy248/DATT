package com.example.demo.service;

import com.example.demo.domain.Supplier;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> getAll() {
        return supplierRepository.findByDeletedFalseOrderByIdDesc();
    }

    public Supplier findById(Long id) {
        if (id == null) return null;
        return supplierRepository.findById(id).filter(s -> !s.isDeleted()).orElse(null);
    }

    @Transactional
    public Supplier save(Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @Transactional
    public void delete(long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy nhà cung cấp"));
        supplier.setDeleted(true);
        supplierRepository.save(supplier);
    }
}
